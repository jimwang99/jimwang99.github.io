---
title: "Python and Freemind ElementTree"
date: 2015-07-19
aliases:
  - "/blog/tool/2015-07-19-python-and-freemind-elementtree/"
---

我曾经自己用Python写过一个小工具来parse Freemind文件（XML格式）然后生成RestructureText和Latex格式。这个小工具的目的是为了实践我的“源文件唯一”的理念。因为我的简历（包括既往项目总结）需要保存为两种不同格式，一个为了放在个人网站上所以是HTML，另一个当然是PDF格式。

今天瞎琢磨的时候发现，其实Python对于XML文件格式支持的极好。[The ElementTree XML API](https://docs.python.org/2/library/xml.etree.elementtree.html#module-xml.etree.ElementTree)这个模块将XML parse成一个Tree。

```
Each element has a number of properties associated with it:
  a tag which is a string identifying what kind of data this element represents (the element type, in other words).
  a number of attributes, stored in a Python dictionary.
  a text string.
  an optional tail string.
  a number of child elements, stored in a Python sequence
```

Python的Markdown也能够utilize这个ElementTree模块。它能够将Markdown文件Parse成eTree（也能够在之前和之后加上其他的process，以callback的形式存在）。
