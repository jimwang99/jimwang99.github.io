"""Evaluate OfficeCLI on copies of the reviewed FlashAttention export."""

import argparse
import hashlib
import importlib.util
import json
import logging
import os
from pathlib import Path
import posixpath
import shutil
import subprocess
import sys
import time
from zipfile import ZipFile, ZIP_DEFLATED

from lxml import etree as ET
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--officecli', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path, help='New directory for disposable trial files')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parents[2]
WORK = args.output.resolve()
CLI = args.officecli.resolve()
if not CLI.is_file():
    parser.error('OfficeCLI binary does not exist')
if WORK.exists():
    parser.error('Use a new output directory so earlier trial evidence is preserved')
WORK.mkdir(parents=True)
EXPORT = ROOT / 'exports/understanding-flashattention.zh-cn'
SOURCE = EXPORT / 'understanding-flashattention.zh-cn.docx'
MANIFEST = EXPORT / 'manifest.json'
MARKDOWN = ROOT / 'content/posts/machine-learning/understanding-flashattention.zh-cn.md'
ENV = {**os.environ, 'OFFICECLI_NO_AUTO_RESIDENT': '1'}
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}
results = {'commands': {}, 'checks': {}}
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('review', ROOT / '.agents/skills/review-wechat-docx/scripts/check_docx.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


def run(name, *args):
    start = time.monotonic()
    process = subprocess.run([str(CLI), *map(str, args)], env=ENV, capture_output=True, text=True, timeout=90)
    (WORK / f'{name}.stdout').write_text(process.stdout)
    (WORK / f'{name}.stderr').write_text(process.stderr)
    record = {'args': list(map(str, args)), 'exit_code': process.returncode, 'seconds': round(time.monotonic()-start, 3)}
    try:
        record['result'] = json.loads(process.stdout)
    except ValueError:
        record['stdout_bytes'] = len(process.stdout.encode())
    results['commands'][name] = record
    logger.info('%s: exit %s', name, process.returncode)
    return process


def check(name, path):
    results['checks'][name] = review.check(path, MANIFEST, MARKDOWN)
    logger.info('%s: review %s', name, results['checks'][name]['structural_pass'])


def rewrite(source, destination, document):
    with ZipFile(source) as src, ZipFile(destination, 'w', ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = ET.tostring(document, xml_declaration=True, encoding='UTF-8', standalone=True) if item.filename == 'word/document.xml' else src.read(item.filename)
            dst.writestr(item, data)


def content_signature(path):
    namespaces = {**NS, 'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                  'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
    with ZipFile(path) as package:
        document = ET.fromstring(package.read('word/document.xml'))
        relations = {item.get('Id'): item.get('Target') for item in ET.fromstring(package.read('word/_rels/document.xml.rels'))}
        images = []
        for image in document.findall('.//a:blip', namespaces):
            target = relations[image.get(f"{{{namespaces['r']}}}embed")]
            member = target.lstrip('/') if target.startswith('/') else posixpath.normpath('word/' + target)
            images.append(hashlib.sha256(package.read(member)).hexdigest())
        links = [{'text': ''.join(link.xpath('.//w:t/text()', namespaces=NS)),
                  'target': relations[link.get(f"{{{namespaces['r']}}}id")]}
                 for link in document.findall('.//w:hyperlink', NS)]
        return {'images': images, 'links': links,
                'paragraphs': [''.join(p.xpath('.//w:t/text()', namespaces=NS)) for p in document.findall('.//w:p', NS)]}


results['version'] = run('version', '--version').stdout.strip()
results['binary_sha256'] = hashlib.sha256(CLI.read_bytes()).hexdigest()
original_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
results['source_sha256'] = original_hash
results['markdown_sha256'] = hashlib.sha256(MARKDOWN.read_bytes()).hexdigest()
shutil.copyfile(SOURCE, WORK / 'baseline.docx')
check('baseline', SOURCE)
run('baseline-stats', 'view', SOURCE, 'stats', '--json')
run('baseline-validate', 'validate', SOURCE, '--json')
run('baseline-annotated', 'view', SOURCE, 'annotated', '--json')
run('baseline-issues', 'view', SOURCE, 'issues', '--json')

# Remove script formatting and quote fills from a disposable copy, then restore
# them through OfficeCLI's documented set API. The reviewed Markdown stays fixed.
with ZipFile(SOURCE) as src:
    document = ET.fromstring(src.read('word/document.xml'))
commands = []
for pi, paragraph in enumerate(document.find('w:body', NS).findall('w:p', NS), 1):
    shading = paragraph.find('w:pPr/w:shd', NS)
    if shading is not None:
        commands.append({'command': 'set', 'path': f'/body/p[{pi}]', 'props': {'shading': shading.get(f'{{{W}}}fill')}})
        shading.getparent().remove(shading)
    for ri, run_node in enumerate(paragraph.findall('w:r', NS), 1):
        props = {}
        for tag, prop in [('vertAlign', 'vertAlign'), ('position', 'position')]:
            node = run_node.find(f'w:rPr/w:{tag}', NS)
            if node is not None:
                props[prop] = node.get(f'{{{W}}}val')
                node.getparent().remove(node)
        if 'position' in props:
            node = run_node.find('w:rPr/w:sz', NS)
            if node is not None:
                props['size'] = str(int(node.get(f'{{{W}}}val')) / 2)
                node.getparent().remove(node)
        if props:
            commands.append({'command': 'set', 'path': f'/body/p[{pi}]/r[{ri}]', 'props': props})
edited = WORK / 'edited.docx'
rewrite(SOURCE, edited, document)
check('deliberately-unformatted', edited)
assert not results['checks']['deliberately-unformatted']['structural_pass']
(WORK / 'restore-formatting.json').write_text(json.dumps(commands, ensure_ascii=False, indent=2)+'\n')
run('edit-batch', 'batch', edited, '--input', WORK / 'restore-formatting.json', '--json')
check('edited', edited)
run('edited-validate', 'validate', edited, '--json')
run('edited-preview', 'view', edited, 'html')
shutil.copyfile(WORK / 'edited-preview.stdout', WORK / 'edited-preview.html')

# Test full document creation through the tool's advertised dump/batch route.
dump = run('dump', 'dump', SOURCE)
assert dump.returncode == 0
(WORK / 'dump.json').write_text(dump.stdout)
replay = WORK / 'recreated.docx'
if replay.exists():
    replay.unlink()
created = run('create', 'create', replay, '--minimal', '--locale', 'zh-CN', '--json')
assert created.returncode == 0
run('replay-batch', 'batch', replay, '--input', WORK / 'dump.json', '--json')
check('recreated', replay)
run('recreated-validate', 'validate', replay, '--json')
run('recreated-preview', 'view', replay, 'html')
shutil.copyfile(WORK / 'recreated-preview.stdout', WORK / 'recreated-preview.html')
baseline = content_signature(SOURCE)
results['preservation'] = {}
for name, candidate in [('edited', edited), ('recreated', replay)]:
    actual = content_signature(candidate)
    results['preservation'][name] = {key: actual[key] == baseline[key] for key in baseline}
results['images_compared'] = len(baseline['images'])
results['links_compared'] = len(baseline['links'])

rollback = WORK / 'rollback.docx'
shutil.copyfile(SOURCE, rollback)
before = hashlib.sha256(rollback.read_bytes()).hexdigest()
failed_batch = [{'command': 'set', 'path': '/body/p[1]', 'props': {'shading': 'FFFFFF'}},
                {'command': 'set', 'path': '/body/p[9999]', 'props': {'bold': 'true'}}]
(WORK / 'rollback-commands.json').write_text(json.dumps(failed_batch))
run('rollback', 'batch', rollback, '--input', WORK / 'rollback-commands.json', '--json')
results['rollback_bytes_unchanged'] = hashlib.sha256(rollback.read_bytes()).hexdigest() == before
# Keep the large image-bearing dump out of the concise machine-readable results.
results['dump_operations'] = len(results['commands']['dump'].pop('result'))
results['source_unchanged'] = hashlib.sha256(SOURCE.read_bytes()).hexdigest() == original_hash
(WORK / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2)+'\n')
logger.info('Trial results written; source unchanged: %s', results['source_unchanged'])
