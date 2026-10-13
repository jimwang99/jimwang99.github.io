---
name: review-wechat-docx
description: Review a generated DOCX for Jim's WeChat article workflow. Use after Markdown-to-DOCX conversion, before delivery or GitHub storage, and when inline formulas, code, images, or layout fail in the exported document. Check the actual DOCX structure and rendered pages against the reviewed Markdown.
---

# Review WeChat DOCX

Review the exported document without rewriting the approved Markdown. Run this step after DOCX generation and before committing the export to GitHub. Markdown human review and DOCX format review are separate steps: use `write-blog` for the former and this skill for the latter.

## Invocation and tools

Use `$review-wechat-docx <path-to-docx>` in Codex or `/review-wechat-docx <path-to-docx>` in Claude Code. The canonical skill lives in `.agents/skills/review-wechat-docx/`; `.claude/skills/review-wechat-docx` links to it. Maintain the canonical files only.

Run commands from the repository root. Structural checks need only Python's standard library; use `python3` or the available Python runtime. Rendering needs a local DOCX renderer and a way to view page images. Follow the active environment's document instructions when available. Do not assume a Codex plugin, API, or Google Drive connection is available in Claude Code.

## 1. Establish the source

Identify the DOCX, reviewed Markdown, and exporter `manifest.json`. Reuse existing human approval for unchanged Markdown. If source text changes during a fix, return the changed Markdown for human review before exporting again. A formatting-only correction to DOCX does not require another Markdown review.

## 2. Check the file structure

Run the bundled checker:

```sh
python3 .agents/skills/review-wechat-docx/scripts/check_docx.py article.docx --manifest manifest.json --source article.zh-cn.md
```

The checker is at [scripts/check_docx.py](scripts/check_docx.py). It produces JSON and returns failure for structural or content mismatches. Missing source or manifest leaves content verification incomplete; compare with the reviewed source manually before declaring the review complete.

Required representation for this workflow:

- Inline formulas are editable Word text runs with real superscript and subscript formatting. Nested scripts use smaller text and adjusted baselines so an index inside an exponent remains distinct. Preserve primes, indices, powers, operators, grouping, and vector meaning; readable `vec(A)` and parenthesized fraction notation remain acceptable. Check each formula bookmark against its manifest run text, vertical alignment, size, and position. Raw LaTeX commands, flattened caret/underscore notation, inline pictures, and native Word equation objects do not satisfy this workflow.
- Inline code is editable text. Check punctuation, spacing, and code font treatment.
- Markdown blockquotes retain their text, bold emphasis, and links with paragraph background shading: a leading `注意` uses pale red (`FDE9E7`), `笔者` uses pale yellow (`FFF4CC`), and other quotes use light gray (`F2F3F5`). Match the visible prefix even when it is bold. Apply the color across all paragraphs of that quote and check it against `quoteParagraphs` in the manifest.
- Display formulas and code blocks are embedded PNGs in separate paragraphs. Keep code highlighting and indentation. Any image mixed with prose in a paragraph fails this review, even when its OOXML element is named `wp:inline`; standalone block pictures may use that element too.
- Source hashes, editable text, inline conversion records, image count, and image relationships agree with the manifest. No image relies on an external URL.

## 3. Render and inspect every page

Use the documents skill's managed `render_docx.py` when available and open every generated page PNG. This repository's [exporter `--render` option](../../../README.md#export-for-wechat) uses that renderer with the local Chinese font configuration; either agent can run the command when its dependencies are installed. Reuse current previews only when they match the DOCX being reviewed. Regenerate previews after a document change.

Without the managed renderer, use an installed local DOCX-to-PDF renderer such as LibreOffice, followed by a PDF-to-PNG tool such as Poppler. Verify Chinese fonts before judging the pages. If no renderer or image viewer is available, finish structural checks and report visual review as incomplete; do not declare the DOCX ready.

Check Chinese glyphs; inline formula meaning and readability; mid-word breaks in variables and formula tokens; complete equations; code indentation and wrapping; bold text, links, lists, headings, and source order; image clipping; overlaps; and page breaks. Compare each inline formula's `source`, `text`, and `runs` in the manifest, especially compound subscripts, nested powers, and vector accents. Check that script text remains readable and does not collide with the baseline or adjacent lines. Quote shading must cover the paragraph and keep sufficient contrast with text. Structural checks alone do not prove visual or mathematical fidelity.

Fix export defects in the exporter, regenerate from the approved source, and repeat the failed checks plus the page inspection. Keep the Markdown unchanged for representation fixes.

## 4. Report and deliver

Report structural/content checks, visual review, and WeChat transfer separately. A local pass requires both content comparison and inspection of every page; report remaining issues or missing evidence precisely. WeChat paste, save, reopen, and phone preview remain unverified until actually tested, including retention of superscripts, subscripts, nested baselines, and paragraph background colors. The skill does not publish a WeChat post.

Store the verified DOCX, manifest, and backup block PNGs in `exports/<source-stem>/`; keep `_work/` previews and builds ignored. Commit and push under the user's applicable authorization. GitHub is the storage destination; no Google Drive connection is part of this workflow.
