'use strict';

// Keep script ancestry so nested indices can retain their own baseline in Word.
function mathMLToRuns(node) {
  const literal = (text, scripts) => [{ text, scripts }];
  function read(element, scripts = []) {
    const tag = element.localName;
    const children = [...element.children];
    const values = () => children.flatMap(child => read(child, scripts));
    const at = (child, kind) => read(child, [...scripts, kind]);
    const prime = child => /^[′'\s]+$/.test(child.textContent);
    if (['mi', 'mn', 'mo', 'mtext'].includes(tag)) {
      const value = element.textContent.normalize('NFKC').replaceAll('−', '-').replace(/[\u2061-\u2064]/g, '');
      return literal(tag === 'mo' && /^[=+×·⋅<>≤≥-]$/.test(value) ? ` ${value} ` : value, scripts);
    }
    if (['math', 'mrow', 'mstyle', 'mpadded'].includes(tag)) return values();
    if (tag === 'semantics') return read(children[0], scripts);
    if (tag === 'mspace') return literal(' ', scripts);
    if (['msub', 'munder'].includes(tag)) return [...read(children[0], scripts), ...at(children[1], 'sub')];
    if (tag === 'msup') return [...read(children[0], scripts), ...(prime(children[1]) ? read(children[1], scripts) : at(children[1], 'sup'))];
    if (['msubsup', 'munderover'].includes(tag)) {
      const [base, sub, sup] = children;
      return prime(sup) ? [...read(base, scripts), ...read(sup, scripts), ...at(sub, 'sub')]
        : [...read(base, scripts), ...at(sub, 'sub'), ...at(sup, 'sup')];
    }
    if (tag === 'mfrac') return [...literal('(', scripts), ...read(children[0], scripts), ...literal(')/(', scripts), ...read(children[1], scripts), ...literal(')', scripts)];
    if (tag === 'msqrt') return [...literal('sqrt(', scripts), ...values(), ...literal(')', scripts)];
    if (tag === 'mroot') return [...literal('root(', scripts), ...read(children[1], scripts), ...literal(', ', scripts), ...read(children[0], scripts), ...literal(')', scripts)];
    if (tag === 'mover') {
      const accent = children[1].textContent;
      const names = { '→': 'vec', '⃗': 'vec', '^': 'hat', 'ˆ': 'hat', '̂': 'hat', '‾': 'bar', '¯': 'bar', '̄': 'bar', '~': 'tilde', '̃': 'tilde' };
      if (names[accent.trim()]) return [...literal(`${names[accent.trim()]}(`, scripts), ...read(children[0], scripts), ...literal(')', scripts)];
      throw new Error(`Unsupported inline math accent: ${accent}`);
    }
    throw new Error(`Unsupported inline MathML element: ${tag}`);
  }
  const runs = [];
  for (const run of read(node)) {
    run.text = run.text.replace(/\s+/g, ' ');
    const previous = runs.at(-1);
    if (previous && previous.scripts.join() === run.scripts.join()) previous.text = (previous.text + run.text).replace(/\s+/g, ' ');
    else if (run.text) runs.push(run);
  }
  if (runs.length) { runs[0].text = runs[0].text.trimStart(); runs.at(-1).text = runs.at(-1).text.trimEnd(); }
  return runs.filter(run => run.text);
}

module.exports = mathMLToRuns;
