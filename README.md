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
hugo new content posts/my-new-post.md
```

Edit the Markdown file under `content/posts/`. Set `draft: false` when it is ready to publish. Edit `content/_index.md` and `content/about.md` to personalize the site.

## Publish

In the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Push changes to `main`; the workflow builds and publishes the site at `https://jimwang99.github.io/`.

The theme is pinned as a Git submodule. To upgrade it later, update the submodule and check that the Hugo version in `.github/workflows/hugo.yml` meets the new theme's requirements.
