'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const runtime = process.env.CODEX_DOCUMENT_RUNTIME || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime');
const { chromium } = require(path.join(runtime, 'dependencies/node/node_modules/playwright'));
const mathMLToRuns = require('./mathml-to-runs.cjs');

async function main() {
  const browser = await chromium.launch({ headless: true, ...(process.env.WECHAT_CHROMIUM ? { executablePath: process.env.WECHAT_CHROMIUM } : { channel: 'chrome' }) });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><head></head><body></body></html>');
    await page.addScriptTag({ path: process.argv[2] });
    await page.addScriptTag({ content: `window.mathMLToRuns = ${mathMLToRuns.toString()};` });
    const run = (text, ...scripts) => ({ text, scripts });
    const cases = [
      [String.raw`g_i`, [run('g'), run('i', 'sub')]],
      [String.raw`e^{g_{i-1}-g_i}`, [run('e'), run('g', 'sup'), run('i - 1', 'sup', 'sub'), run(' - g', 'sup'), run('i', 'sup', 'sub')]],
      [String.raw`x_i^2`, [run('x'), run('i', 'sub'), run('2', 'sup')]],
      [String.raw`\vec{A}'_m`, [run('vec(A)′'), run('m', 'sub')]],
      [String.raw`\mathbb{V}[m,:]`, [run('V[m,:]')]],
      [String.raw`\mathbb{Y} \cdot \mathbb{V}`, [run('Y ⋅ V')]],
      [String.raw`\vec{A}_m=f(\vec{A}_{m-1})`, [run('vec(A)'), run('m', 'sub'), run(' = f(vec(A)'), run('m - 1', 'sub'), run(')')]],
      [String.raw`\frac{a+b}{c_d}`, [run('(a + b)/(c'), run('d', 'sub'), run(')')]],
      [String.raw`\sqrt{x_i}`, [run('sqrt(x'), run('i', 'sub'), run(')')]],
    ];
    for (const [source, expected] of cases) {
      const actual = await page.evaluate(source => {
        const host = document.createElement('div');
        katex.render(source, host, { output: 'mathml', throwOnError: true });
        return window.mathMLToRuns(host.querySelector('math'));
      }, source);
      assert.deepEqual(actual, expected, source);
    }
    await assert.rejects(page.evaluate(() => {
      const host = document.createElement('div');
      host.innerHTML = '<math><unsupported/></math>';
      return window.mathMLToRuns(host.querySelector('math'));
    }), /Unsupported inline MathML element/);
    process.stdout.write('Inline math conversion regression checks passed.\n');
  } finally { await browser.close(); }
}

main().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
