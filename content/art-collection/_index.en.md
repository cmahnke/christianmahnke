---
title: "Art Collection"
metaPage: true
displayinlist: false
archive: false
news: false
sectionContent: false
layout: art-collection
js:
  - ts/art-collection.ts
cascade:
  - _target:
      kind: '{page,section}'
      lang: en
      path: '**'
    params:
      archive: false
      news: false
      metaPage: true
      displayinlist: false
      sitemap:
        disable: true
---
