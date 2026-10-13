# When Moore's Law Ends

This is a personal blog built with [Hugo](https://gohugo.io/) and the [Book theme](https://github.com/alex-shpak/hugo-book). GitHub Actions publishes it to GitHub Pages.

## Preview locally

Install the Hugo Extended version used in [the publishing workflow](.github/workflows/hugo.yml), then run:

```sh
git submodule update --init --recursive
hugo server -D
```

Open `http://localhost:1313/`. The `-D` flag includes draft posts in the preview.

## Write a post

```sh
hugo new content posts/architecture/my-new-post.en.md
```

Edit the Markdown file under `content/posts/`. Set `draft: false` when it is ready to publish. Each topic has an `_index.md` file that controls its sidebar label. Edit `content/_index.md` and `content/about.md` to personalize the site.

Write English and Chinese versions beside each other as `<slug>.en.md` and `<slug>.zh-cn.md`, with front matter in each file. Keep the same topic and slug so [Hugo recognizes them as translations](https://gohugo.io/content-management/multilingual/). The Book theme's language menu links to the other version; each language's post list contains only its own version.

English URLs stay at `/posts/<topic>/<slug>/`; Chinese URLs use `/zh-cn/posts/<topic>/<slug>/`. For example, `my-new-post.en.md` and `my-new-post.zh-cn.md` belong to the same article. Both are full blog versions. Put the short English summary in a `## TL;DR` section near the beginning of the English post, and its Chinese counterpart in a `## 概要` section near the beginning of the Chinese post. The default package has no separate WeChat or LinkedIn file. Existing posts without a language suffix remain in the default English site.

## Imported articles

Earlier articles are grouped by topic under `content/posts/`. A series can have its own nested section, such as `content/posts/architecture/risc-v-architecture-training/`. The articles came from the local Obsidian Publish folder, with images recovered from local backups. Edit the Markdown pages directly.

## Export for WeChat

Export a blog page as DOCX with editable prose, inline formulas, and inline code. Inline formulas use Word superscript and subscript formatting; nested scripts use smaller text with adjusted baselines. Display formulas and code blocks become embedded PNGs; code blocks retain syntax highlighting. Markdown quotes beginning with `注意` get a pale red paragraph background, `笔者` gets pale yellow, and other quotes get light gray. The exporter uses Hugo's existing math and shortcode rendering and does not change the Markdown source.

**Review comes first:** finish and validate the Markdown, then give it to Jim for human review. Run the exporter only after Jim approves that version. Angle selection or an instruction to draft does not approve the resulting Markdown. If the Markdown changes after approval, return the revised version for review before exporting again.

```sh
scripts/install-officecli
scripts/export-wechat-docx content/posts/machine-learning/understanding-flashattention.zh-cn.md --render
```

This local workflow uses Hugo and Chrome for article assets, [OfficeCLI](https://github.com/iOfficeAI/OfficeCLI/releases/tag/v1.0.157) for DOCX creation and rendering, and the Codex document runtime at `~/.cache/codex-runtimes/codex-primary-runtime` for Node, Python, and Playwright. `scripts/install-officecli` installs the pinned binary under ignored `.tools/officecli/` and verifies its checksum. Run OfficeCLI commands through `scripts/officecli`; no global installation is needed. Set `CODEX_DOCUMENT_RUNTIME` for a different runtime location or `WECHAT_CHROMIUM` for the article browser. OfficeCLI's screenshot renderer also needs an installed browser it supports, such as Chrome. Both Codex and Claude Code can run this local workflow; it is not part of site publishing.

The official [OfficeCLI skill](.agents/skills/officecli/SKILL.md) is installed in `.agents/skills/officecli/`, with `.claude/skills/officecli` linking to it. Use `$officecli` in Codex or `/officecli` in Claude Code.

The DOCX is saved under `exports/<source-stem>/`, beside an `assets/` directory of backup PNGs and `manifest.json` with source hashes and image metadata. `--output <directory>` changes the destination. `--render` uses OfficeCLI to create `document.html` and a PNG for each page under `_work/preview/`; inspect every page before use, especially long formulas and code blocks. Commit the final DOCX, manifest, and backup PNGs to GitHub with the reviewed Markdown. Temporary builds and previews under `_work/` remain ignored. The `exports/` directory stays outside Hugo content and static assets, so it does not create blog pages or site downloads.

GitHub is the storage location; no Google Drive connection or upload is needed. Download the DOCX from the repository when preparing a WeChat post. Verify images after saving, reopening, and viewing the WeChat draft on a phone; this transfer still needs manual verification. Keep `assets/` available if an image needs uploading separately. Remote article images are not fetched by the exporter.

### Required DOCX review

After export and before delivery or GitHub storage, run [review-wechat-docx](.agents/skills/review-wechat-docx/SKILL.md). It requires OfficeCLI schema validation and checks editable inline content and its script formatting, quote background colors, standalone PNGs, source and text hashes, and image relationships, then requires inspection of every rendered page. It records local review separately from the actual WeChat transfer test, including whether WeChat retains superscripts, subscripts, and paragraph shading.

- **Codex:** `$review-wechat-docx exports/<source-stem>/<source-stem>.docx`
- **Claude Code:** `/review-wechat-docx exports/<source-stem>/<source-stem>.docx`

Claude Code loads the project skill through `.claude/skills/review-wechat-docx`, a symlink to the canonical `.agents/skills/review-wechat-docx` directory. Maintain the shared files there. This uses Claude Code's [project skill layout and invocation](https://code.claude.com/docs/en/skills). The checker needs only Python's standard library; without OfficeCLI page previews and image inspection, visual review remains incomplete.

```sh
scripts/officecli validate exports/understanding-flashattention.zh-cn/understanding-flashattention.zh-cn.docx --json
python3 .agents/skills/review-wechat-docx/scripts/check_docx.py \
  exports/understanding-flashattention.zh-cn/understanding-flashattention.zh-cn.docx \
  --manifest exports/understanding-flashattention.zh-cn/manifest.json \
  --source content/posts/machine-learning/understanding-flashattention.zh-cn.md
```

## Publish

In the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Push changes to `main`; the workflow builds and publishes the site at `https://jimwang99.github.io/`.

The theme is pinned as a Git submodule. To upgrade it later, update the submodule and check that the Hugo version in `.github/workflows/hugo.yml` meets the new theme's requirements.
