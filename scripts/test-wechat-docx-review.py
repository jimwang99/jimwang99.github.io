"""Check that review catches lost script formatting and wrong quote colors."""

import importlib.util
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
import xml.etree.ElementTree as ET
from zipfile import ZipFile, ZIP_DEFLATED


REPO = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('checker', REPO / '.agents/skills/review-wechat-docx/scripts/check_docx.py')
checker = importlib.util.module_from_spec(spec)
sys.dont_write_bytecode = True
spec.loader.exec_module(checker)
base = REPO / 'exports/understanding-flashattention.zh-cn'
original = base / 'understanding-flashattention.zh-cn.docx'
manifest = base / 'manifest.json'
source = REPO / 'content/posts/machine-learning/understanding-flashattention.zh-cn.md'


def damaged_copy(destination, mutation):
    with ZipFile(original) as package, ZipFile(destination, 'w', ZIP_DEFLATED) as target:
        document = ET.fromstring(package.read('word/document.xml'))
        assert mutation(document), 'Fixture does not contain the formatting under test'
        for item in package.infolist():
            data = ET.tostring(document, encoding='utf-8', xml_declaration=True) if item.filename == 'word/document.xml' else package.read(item.filename)
            target.writestr(item, data)


def strip_run_property(document, name):
    count = 0
    for properties in document.findall('.//w:rPr', checker.NS):
        node = properties.find('w:' + name, checker.NS)
        if node is not None:
            properties.remove(node)
            count += 1
    return count


def change_quote_color(document):
    for node in document.findall('.//w:pPr/w:shd', checker.NS):
        if node.get(f"{{{checker.NS['w']}}}fill") == 'FDE9E7':
            node.set(f"{{{checker.NS['w']}}}fill", 'FFF4CC')
            return True
    return False


report = checker.check(original, manifest, source)
assert report['structural_pass'] and not report['pending_content_checks'], report
with TemporaryDirectory(prefix='wechat-review-test-') as temporary:
    for name, mutation, error in [
        ('scripts', lambda root: strip_run_property(root, 'vertAlign'), 'script formatting differs'),
        ('nested-scripts', lambda root: strip_run_property(root, 'position'), 'script formatting differs'),
        ('quote-color', change_quote_color, 'paragraph background differs'),
    ]:
        copy = Path(temporary) / (name + '.docx')
        damaged_copy(copy, mutation)
        report = checker.check(copy, manifest, source)
        assert not report['structural_pass'] and any(error in item for item in report['errors']), report
sys.stdout.write('DOCX review regression checks passed.\n')
