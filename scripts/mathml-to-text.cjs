'use strict';

// Linear notation stays readable when a clipboard drops rich-text formatting.
function mathMLToText(node) {
  function read(element) {
    const tag = element.localName;
    const children = [...element.children];
    const values = () => children.map(read);
    const script = value => /^(?:\p{L}|\d+)$/u.test(value) ? value : `(${value})`;
    const power = value => /^'+$/.test(value) ? value : `^${script(value)}`;
    if (['mi', 'mn', 'mo', 'mtext'].includes(tag)) {
      const value = element.textContent.normalize('NFKC').replaceAll('−', '-').replaceAll('′', "'").replace(/[\u2061-\u2064]/g, '');
      return tag === 'mo' && /^[=+×·⋅<>≤≥-]$/.test(value) ? ` ${value} ` : value;
    }
    if (['math', 'mrow', 'mstyle', 'mpadded'].includes(tag)) return values().join('');
    if (tag === 'semantics') return read(children[0]);
    if (tag === 'mspace') return ' ';
    if (tag === 'msub') { const [base, sub] = values(); return `${base}_${script(sub.trim())}`; }
    if (tag === 'msup') { const [base, sup] = values(); return base + power(sup.trim()); }
    if (tag === 'msubsup') {
      const [base, sub, sup] = values();
      return /^'+$/.test(sup.trim()) ? `${base}${sup.trim()}_${script(sub.trim())}` : `${base}_${script(sub.trim())}${power(sup.trim())}`;
    }
    if (tag === 'mfrac') { const [top, bottom] = values(); return `(${top})/(${bottom})`; }
    if (tag === 'msqrt') return `sqrt(${values().join('')})`;
    if (tag === 'mroot') { const [base, degree] = values(); return `root(${degree}, ${base})`; }
    if (tag === 'mover') {
      const [base, accent] = values();
      const names = { '→': 'vec', '⃗': 'vec', '^': 'hat', 'ˆ': 'hat', '̂': 'hat', '‾': 'bar', '¯': 'bar', '̄': 'bar', '~': 'tilde', '̃': 'tilde' };
      if (names[accent.trim()]) return `${names[accent.trim()]}(${base})`;
      throw new Error(`Unsupported inline math accent: ${accent}`);
    }
    if (tag === 'munder') { const [base, sub] = values(); return `${base}_${script(sub.trim())}`; }
    if (tag === 'munderover') { const [base, sub, sup] = values(); return `${base}_${script(sub.trim())}${power(sup.trim())}`; }
    throw new Error(`Unsupported inline MathML element: ${tag}`);
  }
  return read(node).replace(/\s+/g, ' ').trim();
}

module.exports = mathMLToText;
