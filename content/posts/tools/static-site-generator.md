---
title: "Static Site Generator"
date: 2019-01-19
aliases:
  - "/blog/tool/2019-01-19-static-site-generator/"
---

Trying to find the perfect static site generator. Used to use Pelican, because it’s written in Python. Also tried with Jekyll, the most popular candidate, because it’s used by Github. Their common problems are

* Not intuitive enough. Seems like something programmer created for programmer.
* There are very restricted requirements of directory structure of the content. And they doesn’t fit my understanding/requirement.

Now I’m trying Hugo, which is written in Go, and it’s really fast. The best feature I like about it is **page bundles**. It allows you to put articles in the same/separated directory with their own resources.

## Support MathJax

Use method 2 in <https://divadnojnarg.github.io/blog/mathjax/>

Put he following content in `/layout/partials/mathjax_support.html`

```
<script type="text/javascript" async
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
  MathJax.Hub.Config({
  tex2jax: {
    inlineMath: [['$','$'], ['\\(','\\)']],
    displayMath: [['$$','$$']],
    processEscapes: true,
    processEnvironments: true,
    skipTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
    TeX: { equationNumbers: { autoNumber: "AMS" },
         extensions: ["AMSmath.js", "AMSsymbols.js"] }
  }
  });
  MathJax.Hub.Queue(function() {
    // Fix <code> tags after MathJax finishes running. This is a
    // hack to overcome a shortcoming of Markdown. Discussion at
    // https://github.com/mojombo/jekyll/issues/199
    var all = MathJax.Hub.getAllJax(), i;
    for(i = 0; i < all.length; i += 1) {
        all[i].SourceElement().parentNode.className += ' has-jax';
    }
  });

  MathJax.Hub.Config({
  // Autonumbering by mathjax
  TeX: { equationNumbers: { autoNumber: "AMS" } }
  });
</script>
```

And add the following into header.html between `<head>` and `<\head>`

```
{{ partial "mathjax_support.html" . }}
```
