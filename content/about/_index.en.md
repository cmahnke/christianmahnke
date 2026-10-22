---
title: "About me"
params:
  metaPage: true
  displayinlist: false
  schema: about.html
  js:
    - ts/portrait.ts
  preload:
    - /about/contact/self-portrait.jpg
sitemap:
  priority: 1.0
  changeFreq: monthly
cascade:
  - target:
      kind: section
    params:
      indexRecursive: true
  - target:
      kind: '{page,section}'
    params:
      Sitemap:
        Disable: true
---

More on me and this page.
