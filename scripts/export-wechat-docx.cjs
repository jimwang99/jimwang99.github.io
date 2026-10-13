#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');

const repo = path.resolve(__dirname, '..');
const runtime = process.env.CODEX_DOCUMENT_RUNTIME || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime');
const packages = path.join(runtime, 'dependencies/node/node_modules');
const { chromium } = require(path.join(packages, 'playwright'));
const mathMLToText = require('./mathml-to-text.cjs');
const docx = require(path.join(packages, 'docx'));
const { Document, Paragraph, TextRun, ImageRun, ExternalHyperlink, Packer, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType, LevelFormat } = docx;
const python = path.join(runtime, 'dependencies/python/bin/python3');
const skill = path.join(runtime, 'plugins/openai-primary-runtime/plugins/documents/skills/documents');
const CONTENT_WIDTH = 640;

function csvRows(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(value.replace(/\r$/, '')); value = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else value += c;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const header = rows.shift();
  return rows.map(row => Object.fromEntries(header.map((key, i) => [key, row[i]])));
}

function log(message) { process.stdout.write(`${message}\n`); }

async function renderArticle(site, url, output) {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.WECHAT_CHROMIUM ? { executablePath: process.env.WECHAT_CHROMIUM } : { channel: 'chrome' }),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 3, colorScheme: 'light' });
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.route('**/*', async route => {
      const request = new URL(route.request().url());
      if (request.origin !== 'http://export.invalid') return route.abort();
      let file = path.resolve(site, '.' + decodeURIComponent(request.pathname));
      if (!file.startsWith(site + path.sep) && file !== site) return route.abort();
      if (file.endsWith(path.sep) || (fs.existsSync(file) && fs.statSync(file).isDirectory())) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'Missing local asset' });
      const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png' }[path.extname(file)];
      return route.fulfill({ path: file, contentType: type || 'application/octet-stream' });
    });
    await page.goto('http://export.invalid' + url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('article.book-post .book-post-content').waitFor();
    const errors = await page.locator('.katex-error').allTextContents();
    if (errors.length || failures.length) throw new Error(`Article rendering failed: ${[...errors, ...failures].join('; ')}`);
    const before = await page.evaluate(() => {
      const article = document.querySelector('article.book-post');
      const content = article.querySelector('.book-post-content');
      const title = article.querySelector('h1').textContent;
      // Hugo's math stylesheet lives inside the article; retain it for screenshots.
      content.querySelectorAll('link[rel="stylesheet"]').forEach(element => document.head.appendChild(element));
      content.querySelectorAll('script, a.anchor').forEach(element => element.remove());
      document.body.replaceChildren(content);
      content.id = 'export-article';
      return { title };
    });
    await page.addStyleTag({ content: `
      html, body { margin: 0 !important; padding: 0 !important; background: white !important; color: #171717 !important; }
      #export-article { width: ${CONTENT_WIDTH}px; margin: 24px !important; font: 16px/1.6 Arial, "PingFang SC", sans-serif; }
      #export-article .katex { font-size: 1.04em; }
      #export-article .katex-display { overflow: visible !important; margin: 0 !important; }
      .export-capture { display: inline-block; padding: 3px; background: white; vertical-align: baseline; line-height: normal; }
      .export-block { display: block; width: max-content; padding: 10px 6px; background: white; }
      #export-article pre { padding: 14px !important; margin: 0 !important; overflow: visible !important; white-space: pre-wrap !important; overflow-wrap: anywhere; }
      #export-article pre code { font: 14px/1.5 Menlo, monospace !important; white-space: pre-wrap !important; overflow-wrap: anywhere; }
      #export-article pre code > span { display: inline !important; }
      #export-article pre code > span > span { display: inline !important; }
      #export-article pre [style*="color:#75715e"] { color: #b6b29f !important; }
      #export-article .export-code { width: ${CONTENT_WIDTH}px; padding: 0; background: #272822; }
      #export-article code:not(pre code) { font: 14px/1.25 Menlo, monospace; color: #202020; background: #f1f3f5; padding: 2px 3px; }
    ` });
    await page.addScriptTag({ content: `window.mathMLToText = ${mathMLToText.toString()};` });
    const { counts, inlineText } = await page.evaluate(() => {
      const root = document.querySelector('#export-article');
      const displays = [...root.querySelectorAll('.katex-display')];
      const inlines = [...root.querySelectorAll('.katex')].filter(node => !node.closest('.katex-display'));
      const blocks = [...root.querySelectorAll('pre')];
      const codes = [...root.querySelectorAll('code')].filter(node => !node.closest('pre'));
      const originals = [...root.querySelectorAll('img')];
      if (originals.some(node => !node.complete || !node.naturalWidth)) throw new Error('An article image is missing; use a local image before export');
      const inlineText = [];
      for (const node of inlines) {
        const source = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
        const math = node.querySelector('.katex-mathml math');
        if (!math) throw new Error(`Inline formula lacks MathML: ${source}`);
        const text = window.mathMLToText(math);
        if (!text) throw new Error(`Inline formula became empty: ${source}`);
        inlineText.push({ kind: 'inline-math', source, text });
        node.replaceWith(document.createTextNode(text));
      }
      for (const node of codes) {
        inlineText.push({ kind: 'inline-code', source: node.textContent, text: node.textContent });
        node.dataset.exportInlineCode = 'true';
      }
      for (const [kind, nodes] of [['display-math', displays], ['code-block', blocks], ['image', originals]]) {
        for (const node of nodes) {
          const wrapper = document.createElement('span');
          const block = kind === 'display-math' || kind === 'code-block' || kind === 'image';
          wrapper.className = 'export-capture' + (block ? ' export-block' : '') + (kind === 'code-block' ? ' export-code' : '');
          wrapper.dataset.kind = kind;
          wrapper.dataset.source = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent || node.getAttribute('alt') || node.textContent;
          node.replaceWith(wrapper); wrapper.appendChild(node);
        }
      }
      const targets = [...root.querySelectorAll('.export-capture')];
      targets.forEach((node, index) => { node.dataset.asset = `asset-${String(index + 1).padStart(3, '0')}`; });
      return { counts: { displayMath: displays.length, inlineMathText: inlines.length, codeBlocks: blocks.length, inlineCodeText: codes.length, originalImages: originals.length, total: targets.length }, inlineText };
    });
    await page.evaluate(() => document.fonts.ready);
    const assets = [];
    for (let index = 0; index < counts.total; index++) {
      const id = `asset-${String(index + 1).padStart(3, '0')}`;
      const target = page.locator(`[data-asset="${id}"]`);
      const measurement = await target.evaluate(node => {
        const box = node.getBoundingClientRect();
        return { kind: node.dataset.kind, source: node.dataset.source, width: box.width, height: box.height };
      });
      const filename = `${id}.png`;
      const png = await target.screenshot({ animations: 'disabled', style: `#export-article * { visibility: hidden !important; } #export-article [data-asset="${id}"], #export-article [data-asset="${id}"] * { visibility: visible !important; }` });
      fs.writeFileSync(path.join(output, 'assets', filename), png);
      const asset = { id, file: `assets/${filename}`, ...measurement };
      assets.push(asset);
      if ((index + 1) % 15 === 0 || index + 1 === counts.total) log(`Images: ${index + 1}/${counts.total}`);
    }
    // Capture the unchanged layout before replacement images can affect geometry.
    for (const asset of assets) {
      const target = page.locator(`[data-asset="${asset.id}"]`);
      await target.evaluate((node, asset) => {
        const image = document.createElement('img');
        image.dataset.exportAsset = asset.id;
        image.alt = asset.source;
        image.width = Math.ceil(asset.width); image.height = Math.ceil(asset.height);
        const block = ['display-math', 'code-block', 'image'].includes(asset.kind);
        if (block) {
          const paragraph = document.createElement('p');
          paragraph.dataset.imageBlock = asset.kind;
          paragraph.appendChild(image); node.replaceWith(paragraph);
        } else node.replaceWith(image);
      }, asset);
    }
    const tree = await page.evaluate(() => {
      function serialize(node) {
        if (node.nodeType === Node.TEXT_NODE) return { text: node.textContent };
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
        return { tag: node.tagName.toLowerCase(), attrs: Object.fromEntries([...node.attributes].map(a => [a.name, a.value])), children: [...node.childNodes].map(serialize).filter(Boolean) };
      }
      const root = document.querySelector('#export-article');
      if (root.querySelector('.katex, pre, code:not([data-export-inline-code])')) throw new Error('Unconverted math or code remains');
      root.querySelectorAll('span').forEach(node => {
        if (node.querySelector('p[data-image-block]')) node.replaceWith(...node.childNodes);
      });
      return serialize(root);
    });
    return { ...before, counts, inlineText, assets, tree };
  } finally { await browser.close(); }
}

function makeDocument(article, output, title) {
  const assets = new Map(article.assets.map(asset => [asset.id, asset]));
  const font = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: 'Heiti SC' };
  function inline(node, style = {}) {
    if (node.text !== undefined) return node.text ? [new TextRun({ text: node.text, ...style })] : [];
    if (node.tag === 'img') {
      const asset = assets.get(node.attrs['data-export-asset']);
      if (!asset) throw new Error('Image lacks an embedded asset');
      const scale = Math.min(1, CONTENT_WIDTH / asset.width, 840 / asset.height);
      asset.displayScale = scale;
      return [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(output, asset.file)), transformation: { width: asset.width * scale, height: asset.height * scale }, altText: { name: asset.id, title: asset.kind, description: asset.source } })];
    }
    if (node.tag === 'br') return [new TextRun({ break: 1 })];
    if (node.tag === 'strong' || node.tag === 'b') style = { ...style, bold: true };
    if (node.tag === 'em' || node.tag === 'i') style = { ...style, italics: true };
    if (node.tag === 'del' || node.tag === 's') style = { ...style, strike: true };
    if (node.tag === 'code') style = { ...style, font: { ascii: 'Menlo', hAnsi: 'Menlo', eastAsia: 'Heiti SC' }, size: 22, shading: { fill: 'F1F3F5' } };
    const children = (node.children || []).flatMap(child => inline(child, style));
    if (node.tag === 'a' && node.attrs.href && !node.attrs.href.startsWith('#')) {
      const link = new URL(node.attrs.href, article.permalink).href;
      return [new ExternalHyperlink({ link, children: (node.children || []).flatMap(child => inline(child, { ...style, color: '1756A9', underline: {} })) })];
    }
    return children;
  }
  const numbering = [];
  function blocks(nodes, context = {}) {
    const result = [];
    let pending = [];
    function paragraphContext() {
      const { list, ...options } = context;
      if (list && !list.used) {
        options.numbering = { reference: list.reference, level: 0 };
        list.used = true;
      }
      return options;
    }
    function flush() {
      if (pending.some(node => node.tag || node.text?.trim())) result.push(new Paragraph({ children: pending.flatMap(node => inline(node)), ...paragraphContext() }));
      pending = [];
    }
    for (const node of nodes) {
      if (node.text !== undefined) { if (node.text.trim()) pending.push(node); continue; }
      if (node.tag === 'p' || /^h[1-6]$/.test(node.tag)) {
        flush();
        const imageKind = node.attrs['data-image-block'];
        const heading = /^h[1-6]$/.test(node.tag) ? Number(node.tag[1]) : null;
        result.push(new Paragraph({
          ...paragraphContext(),
          children: node.children.flatMap(child => inline(child)),
          ...(heading ? { heading: HeadingLevel[`HEADING_${Math.max(1, heading - 1)}`], keepNext: true } : {}),
          ...(imageKind ? { alignment: imageKind === 'display-math' ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { before: 100, after: 180 }, keepLines: true } : {}),
        }));
      } else if (node.tag === 'ul' || node.tag === 'ol') {
        flush();
        const reference = `list-${numbering.length}`;
        numbering.push({ reference, levels: [{ level: 0, format: node.tag === 'ol' ? LevelFormat.DECIMAL : LevelFormat.BULLET, text: node.tag === 'ol' ? '%1.' : '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 280 } } } }] });
        for (const item of node.children.filter(child => child.tag === 'li')) {
          result.push(...blocks(item.children, { ...context, list: { reference, used: false } }));
        }
      } else if (node.tag === 'blockquote') {
        flush(); result.push(...blocks(node.children, { ...context, indent: { left: 280, right: 160 } }));
      } else if (node.tag === 'table') {
        flush();
        const rows = [];
        function collectRows(parent) {
          if (parent.tag === 'tr') rows.push(parent);
          else (parent.children || []).forEach(collectRows);
        }
        collectRows(node);
        result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(row => new TableRow({ children: row.children.filter(cell => ['td', 'th'].includes(cell.tag)).map(cell => new TableCell({ children: blocks(cell.children), margins: { top: 80, bottom: 80, left: 100, right: 100 } })) })) }));
      } else if (['div', 'section'].includes(node.tag) || (node.tag === 'span' && node.children.some(child => child.tag === 'p'))) {
        flush(); result.push(...blocks(node.children, context));
      } else if (['script', 'style', 'link', 'hr'].includes(node.tag)) {
        continue;
      } else pending.push(node);
    }
    flush(); return result;
  }
  const paragraphs = blocks(article.tree.children);
  return new Document({
    creator: 'Jim Wang', title, description: 'Article with editable inline math and code, and PNG display equations and code blocks',
    styles: { default: {
      // docx emits w:wordWrap=0 for true, preventing Latin words from splitting.
      document: { run: { font, size: 24, color: '171717', language: { value: 'en-US', eastAsia: 'zh-CN' } }, paragraph: { spacing: { after: 160, line: 300 }, widowControl: true, wordWrap: true } },
      title: { run: { font, size: 40, bold: true, color: '000000' }, paragraph: { spacing: { before: 0, after: 240 }, keepNext: true } },
      heading1: { run: { font, size: 30, bold: true, color: '000000' }, paragraph: { spacing: { before: 280, after: 140 }, keepNext: true } },
      heading2: { run: { font, size: 26, bold: true, color: '000000' }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true } },
      heading3: { run: { font, size: 24, bold: true, color: '000000' }, paragraph: { keepNext: true } },
    } },
    numbering: { config: numbering },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children: [new Paragraph({ heading: HeadingLevel.TITLE, text: title }), ...paragraphs] }],
  });
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { output: { type: 'string', short: 'o' }, render: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help || positionals.length !== 1) {
    log('Usage: scripts/export-wechat-docx content/posts/topic/article.zh-cn.md [--output exports/article] [--render]');
    if (!values.help) process.exitCode = 2;
    return;
  }
  const source = fs.realpathSync(path.resolve(positionals[0]));
  const relative = path.relative(repo, source).split(path.sep).join('/');
  if (!relative.startsWith('content/') || !source.endsWith('.md')) throw new Error('Input must be a Markdown page in this repository');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  const stem = path.basename(source, '.md');
  const output = path.resolve(values.output || path.join(repo, 'exports', stem));
  const site = path.join(output, '_work/site');
  fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
  const pages = csvRows(execFileSync('hugo', ['list', 'all'], { cwd: repo, encoding: 'utf8' }));
  const metadata = pages.find(page => page.path === relative);
  if (!metadata) throw new Error(`Hugo does not recognize ${relative}`);
  log(`Building ${metadata.title}`);
  execFileSync('hugo', ['--buildDrafts', '--buildFuture', '--buildExpired', '--destination', site, '--baseURL', 'http://export.invalid/', '--quiet'], { cwd: repo, stdio: 'inherit' });
  const article = await renderArticle(site, new URL(metadata.permalink).pathname, output);
  article.permalink = metadata.permalink;
  const document = makeDocument(article, output, metadata.title);
  const draft = path.join(output, '_work/draft.docx');
  fs.writeFileSync(draft, await Packer.toBuffer(document));
  const editableText = node => node.text ?? (node.children || []).map(editableText).join('');
  const textDigest = crypto.createHash('sha256').update((metadata.title + editableText(article.tree)).replace(/\s/g, '')).digest('hex');
  const manifest = { source: relative, sourceSha256: digest, editableTextSha256: textDigest, title: metadata.title, permalink: metadata.permalink, counts: article.counts, inlineText: article.inlineText, assets: article.assets };
  const manifestPath = path.join(output, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(output, '_work/article.json'), JSON.stringify(article.tree, null, 2));
  const final = path.join(output, stem + '.docx');
  const positioned = path.join(output, '_work/positioned.docx');
  execFileSync(python, [path.join(__dirname, 'finish-wechat-docx.py'), draft, manifestPath, positioned], { stdio: 'inherit' });
  execFileSync(python, [path.join(skill, 'scripts/google_docs_title_sanitize.py'), positioned, '--out', final], { stdio: 'inherit' });
  execFileSync(python, [path.join(skill, 'scripts/google_docs_title_sanitize.py'), final, '--check'], { stdio: 'inherit' });
  if (crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex') !== digest) throw new Error('Source changed during export');
  const currentAssets = new Set(article.assets.map(asset => path.basename(asset.file)));
  for (const name of fs.readdirSync(path.join(output, 'assets'))) {
    if (/^asset-\d+\.png$/.test(name) && !currentAssets.has(name)) fs.unlinkSync(path.join(output, 'assets', name));
  }
  log(`DOCX: ${final}`);
  log(`Embedded images: ${article.counts.total}; source unchanged.`);
  if (values.render) {
    const env = { ...process.env };
    if (process.platform === 'darwin') {
      // The bundled headless renderer needs explicit access to macOS CJK fonts.
      const resources = path.join(runtime, 'dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources');
      const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
      const config = path.join(output, '_work/fonts.conf');
      fs.writeFileSync(config, `<?xml version="1.0"?><fontconfig><dir>/System/Library/Fonts</dir><dir>${escape(resources)}/fonts/truetype</dir><include>${escape(resources)}/fontconfig/conf.d</include><cachedir>${escape(output)}/_work/font-cache</cachedir></fontconfig>`);
      env.FONTCONFIG_FILE = config;
    }
    execFileSync(python, [path.join(skill, 'render_docx.py'), final, '--output_dir', path.join(output, '_work/preview'), '--emit_pdf'], { env, stdio: 'inherit' });
  }
}

main().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
