"""Exercise rich text, quote blocks, tables, and list restarts through OfficeCLI."""
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import xml.etree.ElementTree as ET
from zipfile import ZipFile

REPO = Path(__file__).resolve().parent.parent
RUNTIME = Path(os.environ.get('CODEX_DOCUMENT_RUNTIME', Path.home() / '.cache/codex-runtimes/codex-primary-runtime'))
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'


def element(tag, *children, **attrs):
    return {'tag': tag, 'attrs': attrs, 'children': [{'text': child} if isinstance(child, str) else child for child in children]}


article = {
    'assets': [], 'inlineText': [], 'permalink': 'https://example.com/article/',
    'tree': element('div',
        element('p', 'Literal ', element('code', r'\n and \t'), ' stays editable.'),
        element('p', element('a', element('strong', 'Bold link'), href='https://example.com/source')),
        element('blockquote', element('p', element('strong', '注意'), '：', element('a', 'Source', href='https://example.com/note'))),
        element('blockquote', element('p', 'Plain quote.'), element('p', 'Second paragraph.')),
        element('ol', element('li', 'First list.'), element('li', 'Second item.')),
        element('p', 'Between lists.'),
        element('ol', element('li', 'Restarted list.')),
        element('table', element('tbody',
            element('tr', element('th', element('strong', 'Header')), element('th', 'Value')),
            element('tr', element('td', 'Cell ', element('em', 'emphasis')), element('td', '尾部')))),
    ),
}

with TemporaryDirectory(prefix='officecli-docx-test-') as directory:
    output = Path(directory)
    (output / '_work').mkdir()
    docx = output / 'fixture.docx'
    subprocess.run([str(RUNTIME / 'dependencies/node/bin/node'), '-e',
        "const fs=require('node:fs'); const article=JSON.parse(fs.readFileSync(0,'utf8'));"
        "require('./scripts/officecli-docx.cjs').createDocument(article,process.argv[1],'Fixture',process.argv[2]);",
        str(output), str(docx)], cwd=REPO, input=json.dumps(article), text=True, check=True)
    with ZipFile(docx) as package:
        root = ET.fromstring(package.read('word/document.xml'))
        numbering = ET.fromstring(package.read('word/numbering.xml'))
    text = ''.join(node.text or '' for node in root.findall('.//w:t', NS))
    assert r'Literal \n and \t stays editable.' in text, text
    links = root.findall('.//w:hyperlink', NS)
    assert len(links) == 2 and links[0].find('w:r/w:rPr/w:b', NS) is not None
    quotes = root.findall('.//w:pPr/w:shd', NS)
    assert [node.get(W + 'fill') for node in quotes] == ['FDE9E7', 'F2F3F5', 'F2F3F5']
    ids = [node.get(W + 'val') for node in root.findall('.//w:numId', NS)]
    assert len(ids) == 3 and ids[0] == ids[1] and ids[2] != ids[0], ids
    assert all(node.get(W + 'val') == '1' for node in numbering.findall('.//w:startOverride', NS))
    cells = root.findall('.//w:tc', NS)
    assert len(cells) == 4 and all(len(cell.findall('w:p', NS)) == 1 for cell in cells)
    assert cells[0].find('.//w:b', NS) is not None and cells[2].find('.//w:i', NS) is not None
    assert ''.join(node.text or '' for node in cells[2].findall('.//w:t', NS)) == 'Cell emphasis'

sys.stdout.write('OfficeCLI export regression checks passed.\n')
