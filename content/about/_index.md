---
title: "Über mich"
metaPage: true
displayinlist: false
schema: about.html
sitemap:
  priority: 1.0
  changeFreq: monthly
js:
  - ts/portrait.ts
preload:
  - /about/contact/self-potrait.jpg
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

Mehr über mich und diese Seite.
