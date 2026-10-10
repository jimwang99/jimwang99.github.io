# Repository Guidelines

## Project Structure

- `content/posts/<topic>/` contains Markdown posts; `_index.md` files define topic sections. Homepage and author content live in `content/_index.md` and `content/about.md`.
- `static/legacy-media/` holds imported images; reference them as `/legacy-media/<filename>`. `assets/katex.json` configures math rendering.
- `layouts/` contains template overrides. `themes/hugo-book/` is a pinned Git submodule.
- `archetypes/posts.md` defines new-post front matter; `hugo.toml` controls site configuration.

## Development Commands

Use the Hugo Extended version pinned in [the deployment workflow](.github/workflows/hugo.yml).

- `git submodule update --init --recursive` initializes the theme.
- `hugo server -D` starts a local preview with drafts.
- `hugo new content posts/architecture/my-post.md` creates a post from the archetype.
- `hugo -D --minify` builds the site, including drafts, into `public/`.
- `hugo --minify` builds the production site without drafts.

## Content Style and Naming

Use lowercase, hyphenated names for new English slugs. Preserve existing published paths, aliases, and metadata during unrelated edits. New posts need `title`, `date`, and `draft: true`.

Write each Markdown paragraph on one source line. Keep table and code-block line breaks. Escape literal dollar signs as `\$`. Match existing indentation: spaces in templates and YAML, with nested markup indented consistently. No formatter or linter is configured.

Save adaptations beside their blog post as `<slug>-wechat.md` and `<slug>-linkedin.md`; Hugo excludes these suffixes, including during draft previews.

## Validation

No automated test runner or coverage threshold is configured. For content or template changes, run the draft-inclusive build and inspect the affected page, links, images, and navigation. Confirm adaptations stay absent from pages, feeds, and search. Run `git diff --check` for whitespace errors. Keep generated `public/` and `resources/_gen/` output untracked.

## Commits and Pull Requests

Follow the history's short imperative subjects, such as `Add write-blog technical writing skill`. Keep commits focused. PR descriptions should explain the change and validation, link relevant issues, and include screenshots for layout changes. Pushing to `main` triggers GitHub Pages deployment; publish only with authorization.

## Writing Agent Workflow

For drafting or revising posts, follow [write-blog](.agents/skills/write-blog/SKILL.md). Batch related interview questions, preserve Jim's judgments and evidence, and use its manual acceptance cases when changing the skill. Check `git status` before editing and preserve existing user work.
