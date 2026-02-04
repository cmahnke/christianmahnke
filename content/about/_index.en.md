---
title: "About me"
metaPage: true
displayinlist: false
schema: about.html
sitemap:
  priority: 1.0
  changeFreq: monthly
cascade:
  - _target:
      kind: section
    params:
      indexRecursive: true
  - _target:
      kind: '{page,section}'
    params:
      Sitemap:
        Disable: true
---

More on me and this page.
