"""Check a WeChat DOCX for editable inline content and self-contained block PNGs."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
from zipfile import ZipFile


NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}


def compact(text):
    return re.sub(r'\s', '', text)


def check_formatting(document, manifest, errors):
    formulas = {}
    active = None
    for node in document.iter():
        if node.tag == f"{{{NS['w']}}}bookmarkStart" and node.get(f"{{{NS['w']}}}name", '').startswith('inline-math-'):
            name = node.get(f"{{{NS['w']}}}name")
            active = (name, node.get(f"{{{NS['w']}}}id"))
            formulas[name] = []
        elif active and node.tag == f"{{{NS['w']}}}bookmarkEnd" and node.get(f"{{{NS['w']}}}id") == active[1]:
            active = None
        elif active and node.tag == f"{{{NS['w']}}}r":
            run = {'text': ''.join(item.text or '' for item in node.findall('.//w:t', NS))}
            for tag, key in [('position', 'position'), ('sz', 'size')]:
                value = node.find(f'w:rPr/w:{tag}', NS)
                if value is not None:
                    run[key] = value.get(f"{{{NS['w']}}}val")
            align = node.find('w:rPr/w:vertAlign', NS)
            if align is not None:
                run['alignment'] = align.get(f"{{{NS['w']}}}val")
            formulas[active[0]].append(run)
    for item in manifest.get('inlineText', []):
        if item['kind'] != 'inline-math':
            continue
        if 'runs' not in item or 'id' not in item:
            errors.append(f"Inline math lacks rich-text metadata; re-export: {item['source']}")
            continue
        expected = []
        for run in item['runs']:
            value = {'text': run['text']}
            for key in ['position', 'size']:
                if key in run:
                    value[key] = str(run[key])
            if run.get('subScript'):
                value['alignment'] = 'subscript'
            if run.get('superScript'):
                value['alignment'] = 'superscript'
            expected.append(value)
        if formulas.get(item['id']) != expected:
            errors.append(f"Inline math text or script formatting differs: {item['source']}")
    fills = {'warning': 'FDE9E7', 'author': 'FFF4CC', 'default': 'F2F3F5'}
    expected_quotes = []
    if 'quoteParagraphs' not in manifest:
        errors.append('Quote formatting metadata missing; re-export')
    for item in manifest.get('quoteParagraphs', []):
        if item['fill'] != fills.get(item['kind']):
            errors.append(f"Wrong quote color for {item['kind']}")
        expected_quotes.append((compact(item['text']), item['fill']))
    actual_quotes = []
    for paragraph in document.findall('.//w:p', NS):
        shading = paragraph.find('w:pPr/w:shd', NS)
        if shading is not None:
            text = ''.join(item.text or '' for item in paragraph.findall('.//w:t', NS))
            actual_quotes.append((compact(text), shading.get(f"{{{NS['w']}}}fill")))
    if actual_quotes != expected_quotes:
        errors.append('Quote text or paragraph background differs from the manifest')


def check(docx, manifest_path=None, source_path=None):
    errors = []
    pending = []
    with ZipFile(docx) as package:
        document = ET.fromstring(package.read('word/document.xml'))
        text = ''.join(node.text or '' for node in document.findall('.//w:t', NS))
        pictures = document.findall('.//wp:docPr', NS)
        for index, paragraph in enumerate(document.findall('.//w:p', NS), 1):
            if paragraph.find('.//w:drawing', NS) is not None and compact(''.join(paragraph.itertext())):
                errors.append(f'Image mixed with text in paragraph {index}')
        if document.find('.//m:oMath', NS) is not None:
            errors.append('Native Word equation remains')
        if document.find('.//wp:anchor', NS) is not None or document.find('.//w:pict', NS) is not None:
            errors.append('Floating or legacy picture needs replacement by a standalone PNG')
        relationships = {item.get('Id'): item for item in ET.fromstring(package.read('word/_rels/document.xml.rels'))}
        for blip in document.findall('.//a:blip', NS):
            identifier = blip.get(f"{{{NS['r']}}}embed")
            relation = relationships.get(identifier)
            if blip.get(f"{{{NS['r']}}}link") or relation is None or relation.get('TargetMode') == 'External':
                errors.append('Picture is not embedded locally')
                continue
            target = relation.get('Target', '')
            member = target.lstrip('/') if target.startswith('/') else 'word/' + target
            if member not in package.namelist() or not package.read(member).startswith(b'\x89PNG\r\n\x1a\n'):
                errors.append(f'Picture is missing or not PNG: {target}')

    manifest = json.loads(Path(manifest_path).read_text()) if manifest_path else None
    if manifest:
        check_formatting(document, manifest, errors)
        if hashlib.sha256(compact(text).encode()).hexdigest() != manifest['editableTextSha256']:
            errors.append('Editable text differs from the exported source text')
        if len(pictures) != manifest['counts']['total']:
            errors.append('Picture count differs from the manifest')
        assets = {item['id']: item for item in manifest['assets']}
        if {item.get('name') for item in pictures} != set(assets):
            errors.append('Picture identities differ from the manifest')
        if any(item['kind'].startswith('inline-') for item in assets.values()):
            errors.append('Manifest includes inline images')
        inline_records = manifest.get('inlineText', [])
        for kind, count in [('inline-math', 'inlineMathText'), ('inline-code', 'inlineCodeText')]:
            if sum(item['kind'] == kind for item in inline_records) != manifest['counts'].get(count, 0):
                errors.append(f'Inline text count mismatch: {kind}')
        for item in inline_records:
            if not item['text'] or compact(item['text']) not in compact(text):
                errors.append(f"Missing inline text: {item['source']}")
        if source_path:
            if hashlib.sha256(Path(source_path).read_bytes()).hexdigest() != manifest['sourceSha256']:
                errors.append('Markdown source changed since export')
        else:
            pending.append('Compare with the reviewed Markdown source')
    else:
        pending.append('Compare text, formulas, code, and images with the reviewed source; no manifest supplied')
    return {'structural_pass': not errors, 'errors': errors, 'pending_content_checks': pending,
            'image_occurrences': len(pictures), 'visual_review': 'required', 'wechat_transfer': 'unverified'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('docx', type=Path)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--source', type=Path)
    args = parser.parse_args()
    report = check(args.docx, args.manifest, args.source)
    json.dump(report, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write('\n')
    return 0 if report['structural_pass'] else 1


if __name__ == '__main__':
    sys.exit(main())
