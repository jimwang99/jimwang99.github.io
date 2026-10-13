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

English URLs stay at `/posts/<topic>/<slug>/`; Chinese URLs use `/zh-cn/posts/<topic>/<slug>/`. For example, `my-new-post.en.md` and `my-new-post.zh-cn.md` belong to the same article. Both are full blog versions. Put the short English summary in a `## TL;DR` section near the beginning of the English post. The default package has no separate WeChat or LinkedIn file. Existing posts without a language suffix remain in the default English site.

## Imported articles

Earlier articles are grouped by topic under `content/posts/`. A series can have its own nested section, such as `content/posts/architecture/risc-v-architecture-training/`. The articles came from the local Obsidian Publish folder, with images recovered from local backups. Edit the Markdown pages directly.

## Publish

In the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Push changes to `main`; the workflow builds and publishes the site at `https://jimwang99.github.io/`.

The theme is pinned as a Git submodule. To upgrade it later, update the submodule and check that the Hugo version in `.github/workflows/hugo.yml` meets the new theme's requirements.
