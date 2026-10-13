'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const runtime = process.env.CODEX_DOCUMENT_RUNTIME || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime');
const { chromium } = require(path.join(runtime, 'dependencies/node/node_modules/playwright'));
const mathMLToText = require('./mathml-to-text.cjs');

async function main() {
  const browser = await chromium.launch({ headless: true, ...(process.env.WECHAT_CHROMIUM ? { executablePath: process.env.WECHAT_CHROMIUM } : { channel: 'chrome' }) });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><head></head><body></body></html>');
    await page.addScriptTag({ path: process.argv[2] });
    await page.addScriptTag({ content: `window.mathMLToText = ${mathMLToText.toString()};` });
    const cases = [
      [String.raw`g_i`, 'g_i'],
      [String.raw`e^{g_{i-1}-g_i}`, 'e^(g_(i - 1) - g_i)'],
      [String.raw`\vec{A}'_m`, "vec(A)'_m"],
      [String.raw`\mathbb{V}[m,:]`, 'V[m,:]'],
      [String.raw`\mathbb{Y} \cdot \mathbb{V}`, 'Y ⋅ V'],
      [String.raw`\vec{A}_m=f(\vec{A}_{m-1})`, 'vec(A)_m = f(vec(A)_(m - 1))'],
      [String.raw`\frac{a+b}{c_d}`, '(a + b)/(c_d)'],
      [String.raw`\sqrt{x_i}`, 'sqrt(x_i)'],
    ];
    for (const [source, expected] of cases) {
      const actual = await page.evaluate(source => {
        const host = document.createElement('div');
        katex.render(source, host, { output: 'mathml', throwOnError: true });
        return window.mathMLToText(host.querySelector('math'));
      }, source);
      assert.equal(actual, expected, source);
    }
    await assert.rejects(page.evaluate(() => {
      const host = document.createElement('div');
      host.innerHTML = '<math><unsupported/></math>';
      return window.mathMLToText(host.querySelector('math'));
    }), /Unsupported inline MathML element/);
    process.stdout.write('Inline math conversion regression checks passed.\n');
  } finally { await browser.close(); }
}

main().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
