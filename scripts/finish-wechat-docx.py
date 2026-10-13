"""Verify and finalize the DOCX package with text-only inline content."""

from pathlib import Path
import hashlib
import json
import re
import sys
from zipfile import ZipFile, ZIP_DEFLATED

from lxml import etree


def finish(draft, manifest_path, output):
    manifest = json.loads(Path(manifest_path).read_text())
    assets = {item["id"]: item for item in manifest["assets"]}
    namespaces = {
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
        "m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
        "r": "http://schemas.openxmlformats.org/package/2006/relationships",
    }
    with ZipFile(draft) as source:
        document = etree.fromstring(source.read("word/document.xml"))
        text = ''.join(document.xpath('//w:t/text()', namespaces=namespaces))
        digest = hashlib.sha256(re.sub(r'\s', '', text).encode()).hexdigest()
        if digest != manifest['editableTextSha256']:
            raise ValueError('Editable article text changed during conversion')
        pictures = document.findall(".//wp:docPr", namespaces)
        if len(pictures) != manifest["counts"]["total"]:
            raise ValueError("Image occurrence count differs from rendered content")
        for picture in pictures:
            if assets[picture.get('name')]['kind'].startswith('inline-'):
                raise ValueError('Inline content must be editable text')
            paragraph = picture.xpath('ancestor::w:p', namespaces=namespaces)[-1]
            if ''.join(paragraph.xpath('.//w:t/text()', namespaces=namespaces)).strip():
                raise ValueError('Image occurs inside a text paragraph')
        if document.findall(".//m:oMath", namespaces):
            raise ValueError("Native Word math remains; use plain inline text or display PNG")
        media = [name for name in source.namelist() if name.startswith("word/media/") and not name.endswith('/')]
        if any(not name.endswith('.png') for name in media):
            raise ValueError("A non-PNG image was embedded")
        relationships = etree.fromstring(source.read("word/_rels/document.xml.rels"))
        for relationship in relationships:
            if relationship.get("Type", "").endswith("/image") and relationship.get("TargetMode") == "External":
                raise ValueError("An image depends on an external URL")
        temporary = Path(str(output) + '.tmp')
        with ZipFile(temporary, 'w', ZIP_DEFLATED) as destination:
            for item in source.infolist():
                data = etree.tostring(document, xml_declaration=True, encoding='UTF-8', standalone=True) if item.filename == 'word/document.xml' else source.read(item.filename)
                destination.writestr(item, data)
        temporary.replace(output)


if __name__ == '__main__':
    finish(*sys.argv[1:])
