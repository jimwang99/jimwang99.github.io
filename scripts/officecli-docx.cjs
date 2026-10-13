'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const officecli = path.join(__dirname, 'officecli');
const textOf = node => node.text ?? (node.children || []).map(textOf).join('');
const runOffice = args => execFileSync(officecli, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });

function createDocument(article, output, title, target) {
  const commands = [];
  const add = (parent, type, props) => commands.push({ command: 'add', parent, type, props: strings(props) });
  const set = (target, props) => commands.push({ command: 'set', path: target, props: strings(props) });
  const strings = props => Object.fromEntries(Object.entries(props).map(([key, value]) => [key, String(value)]));
  const assets = new Map(article.assets.map(asset => [asset.id, asset]));
  const math = new Map(article.inlineText.filter(item => item.kind === 'inline-math').map(item => [item.id, item]));
  article.quoteParagraphs = [];
  set('/', { author: 'Jim Wang', title, 'docDefaults.font': 'Arial', 'docDefaults.font.eastAsia': 'Heiti SC', 'docDefaults.fontSize': 12, 'docDefaults.color': '171717', 'docDefaults.spaceAfter': '6pt', 'docDefaults.lineSpacing': '1.2x' });
  set('/section[1]', { pageWidth: '8.5in', pageHeight: '11in', marginTop: '50pt', marginBottom: '50pt', marginLeft: '55pt', marginRight: '55pt' });
  add('/styles', 'style', { id: 'Normal', name: 'Normal', font: 'Arial', 'font.ea': 'Heiti SC', size: 12, color: '171717', spaceAfter: '6pt', lineSpacing: '1.2x', widowControl: true, wordWrap: false });
  for (const [id, size, before, after] of [['Title', 20, 0, 12], ['Heading1', 15, 14, 7], ['Heading2', 13, 10, 5], ['Heading3', 12, 8, 5]]) {
    add('/styles', 'style', { id, name: id, basedOn: 'Normal', size, bold: true, color: '000000', spaceBefore: `${before}pt`, spaceAfter: `${after}pt`, keepNext: true });
  }
  function addRun(parent, text, style) {
    const { url, ...props } = style;
    if (url) {
      add(parent, 'hyperlink', { url, text, color: '1756A9', underline: 'single' });
      if (Object.keys(props).length) set(`${parent}/hyperlink[last()]/r[1]`, props);
    } else add(parent, 'run', { text, ...props });
  }
  function inline(node, parent, style = {}) {
    if (node.text !== undefined) { if (node.text) addRun(parent, node.text, style); return; }
    if (node.attrs?.['data-export-inline-math']) {
      const formula = math.get(node.attrs['data-export-inline-math']);
      // OfficeCLI's dump format exposes open/end bookmarks for formatted runs.
      add(parent, 'bookmark', { name: formula.id, open: true });
      for (const run of formula.runs) {
        const { text, subScript, superScript, size, ...rest } = run;
        addRun(parent, text, { ...style, ...rest, ...(subScript ? { subscript: true } : {}), ...(superScript ? { superscript: true } : {}), ...(size ? { size: size / 2 } : {}) });
      }
      add(parent, 'bookmark', { name: formula.id, end: true });
      return;
    }
    if (node.tag === 'img') {
      const asset = assets.get(node.attrs['data-export-asset']);
      if (!asset) throw new Error('Image lacks an embedded asset');
      const scale = Math.min(1, 640 / asset.width, 840 / asset.height);
      asset.displayScale = scale;
      add(parent, 'picture', { src: path.join(output, asset.file), name: asset.id, alt: asset.source, width: `${asset.width * scale * 0.75}pt`, height: `${asset.height * scale * 0.75}pt`, wrap: 'inline' });
      return;
    }
    if (node.tag === 'br') { addRun(parent, '\n', style); return; }
    if (['strong', 'b'].includes(node.tag)) style = { ...style, bold: true };
    if (['em', 'i'].includes(node.tag)) style = { ...style, italic: true };
    if (['del', 's'].includes(node.tag)) style = { ...style, strike: true };
    if (node.tag === 'code') style = { ...style, font: 'Menlo', 'font.ea': 'Heiti SC', size: 11, shading: 'F1F3F5' };
    if (node.tag === 'a' && node.attrs.href && !node.attrs.href.startsWith('#')) style = { ...style, url: new URL(node.attrs.href, article.permalink).href };
    for (const child of node.children || []) inline(child, parent, style);
  }
  let listId = 0;
  function blocks(nodes, parent = '/body', context = {}, reuseEmpty = false) {
    let pending = [];
    function paragraph(nodes, options = {}) {
      const { list, quoteKind, ...props } = context;
      if (list && !list.used) { props.numId = list.id; props.ilvl = 0; list.used = true; }
      if (quoteKind) article.quoteParagraphs.push({ kind: quoteKind, fill: props.shading, text: nodes.map(textOf).join('') });
      if (reuseEmpty) { set(`${parent}/p[1]`, { style: 'Normal', ...props, ...options }); reuseEmpty = false; }
      else add(parent, 'paragraph', { style: 'Normal', ...props, ...options });
      for (const node of nodes) inline(node, `${parent}/p[last()]`);
    }
    function flush() {
      if (pending.some(node => node.tag || node.text?.trim())) paragraph(pending);
      pending = [];
    }
    for (const node of nodes) {
      if (node.text !== undefined) { if (node.text.trim()) pending.push(node); continue; }
      if (node.tag === 'p' || /^h[1-6]$/.test(node.tag)) {
        flush();
        const heading = /^h[1-6]$/.test(node.tag) ? Math.min(3, Math.max(1, Number(node.tag[1]) - 1)) : null;
        const imageKind = node.attrs?.['data-image-block'];
        paragraph(node.children, { ...(heading ? { style: `Heading${heading}`, keepNext: true } : {}), ...(imageKind ? { align: imageKind === 'display-math' ? 'center' : 'left', spaceBefore: '5pt', spaceAfter: '9pt', keepLines: true } : {}) });
      } else if (['ul', 'ol'].includes(node.tag)) {
        flush();
        const id = ++listId;
        add('/numbering', 'num', { id, format: node.tag === 'ol' ? 'decimal' : 'bullet', text: node.tag === 'ol' ? '%1.' : '•', indent: 360, start: node.attrs?.start || 1 });
        for (const item of node.children.filter(child => child.tag === 'li')) blocks(item.children, parent, { ...context, list: { id, used: false } });
      } else if (node.tag === 'blockquote') {
        flush();
        const text = textOf(node).trimStart();
        const quoteKind = text.startsWith('注意') ? 'warning' : text.startsWith('笔者') ? 'author' : 'default';
        blocks(node.children, parent, { ...context, quoteKind, shading: { warning: 'FDE9E7', author: 'FFF4CC', default: 'F2F3F5' }[quoteKind], indent: '14pt', rightIndent: '8pt', spaceBefore: '8pt', spaceAfter: '8pt', keepLines: true });
      } else if (node.tag === 'table') {
        flush();
        const rows = [];
        function collectRows(node) { if (node.tag === 'tr') rows.push(node); else (node.children || []).forEach(collectRows); }
        collectRows(node);
        const cells = rows.map(row => row.children.filter(cell => ['td', 'th'].includes(cell.tag)));
        add(parent, 'table', { rows: rows.length, cols: Math.max(...cells.map(row => row.length)), width: '100%', padding: 100, 'border.all': 'single;4;D8D8D8' });
        cells.forEach((row, r) => row.forEach((cell, c) => blocks(cell.children, `${parent}/tbl[last()]/tr[${r + 1}]/tc[${c + 1}]`, {}, true)));
      } else if (['div', 'section'].includes(node.tag) || (node.tag === 'span' && node.children.some(child => child.tag === 'p'))) {
        flush(); blocks(node.children, parent, context);
      } else if (!['script', 'style', 'link', 'hr'].includes(node.tag)) pending.push(node);
    }
    flush();
  }
  add('/body', 'paragraph', { style: 'Title', keepNext: true, text: title });
  blocks(article.tree.children);
  const batch = path.join(output, '_work/officecli-commands.json');
  fs.writeFileSync(batch, JSON.stringify(commands, null, 2) + '\n');
  runOffice(['create', target, '--minimal', '--force']);
  const result = JSON.parse(runOffice(['batch', target, '--input', batch, '--json']));
  fs.writeFileSync(path.join(output, '_work/officecli-batch-result.json'), JSON.stringify(result, null, 2) + '\n');
  if (!result.success || result.data?.results?.some(item => !item.success)) throw new Error('OfficeCLI batch failed; see _work/officecli-batch-result.json');
  validateDocument(target);
}

function validateDocument(target) {
  const result = JSON.parse(runOffice(['validate', target, '--json']));
  if (!result.success || result.data?.count !== 0) throw new Error(`OfficeCLI validation failed: ${JSON.stringify(result)}`);
  return result;
}

async function renderDocument(target, preview, chromium) {
  fs.mkdirSync(preview, { recursive: true });
  const html = path.join(preview, 'document.html');
  // Ask OfficeCLI's paginator for the page count; OfficeCLI also captures each PNG.
  const browser = await chromium.launch({ headless: true, ...(process.env.WECHAT_CHROMIUM ? { executablePath: process.env.WECHAT_CHROMIUM } : { channel: 'chrome' }) });
  let count, width, height;
  try {
    const page = await browser.newPage();
    const moved = new Set();
    while (true) {
      runOffice(['view', target, 'html', '-o', html]);
      await page.goto(pathToFileURL(html).href);
      await page.waitForFunction(() => /^PAGES:\d+$/.test(document.title));
      const orphans = await page.evaluate(() => [...document.querySelectorAll('.page-body')].slice(0, -1).flatMap(body => {
        const visible = [...body.children].filter(element => element.offsetHeight > 0);
        let index = visible.length;
        while (index > 0 && /^H[1-6]$/.test(visible[index - 1].tagName)) index--;
        return index > 0 && index < visible.length ? [visible[index].dataset.path] : [];
      }));
      if (!orphans.length) break;
      // v1.0.157's HTML paginator ignores keepNext. Apply real DOCX page
      // breaks to stranded headings, then ask OfficeCLI to paginate again.
      for (const heading of orphans) {
        if (!heading || moved.has(heading)) throw new Error(`Cannot keep heading with its content: ${heading}`);
        runOffice(['set', target, heading, '--prop', 'pageBreakBefore=true']);
        moved.add(heading);
      }
    }
    count = Number((await page.title()).split(':')[1]);
    ({ width, height } = await page.locator('.page').first().evaluate(element => ({ width: Math.round(element.offsetWidth), height: Math.round(element.offsetHeight) })));
  } finally { await browser.close(); }
  validateDocument(target);
  if (!count) throw new Error('OfficeCLI preview contains no pages');
  for (let number = 1; number <= count; number++) {
    // v1.0.157 skips pagination for --page 1 and clips overflowing blocks.
    // An absent second page forces full pagination; only page 1 remains visible.
    const filter = number === 1 && count > 1 ? `1,${count + 1}` : String(number);
    runOffice(['view', target, 'screenshot', '--render', 'html', '--page', filter, '--screenshot-width', String(width), '--screenshot-height', String(height), '-o', path.join(preview, `page-${number}.png`)]);
    process.stdout.write(`OfficeCLI preview: ${number}/${count}\n`);
  }
  for (const file of fs.readdirSync(preview)) {
    const match = /^page-(\d+)\.png$/.exec(file);
    if (match && Number(match[1]) > count) fs.unlinkSync(path.join(preview, file));
  }
  return count;
}

module.exports = { createDocument, renderDocument, validateDocument };
