---
title: "Meta"
metaPage: true
displayinlist: false
archive: false
news: false
sectionContent: false
cascade:
  - _target:
      kind: '{page,section}'
      lang: de
      path: '**'
    params:
      archive: false
      news: false
      sitemap:
        disable: true
---

This page provides some statistical analyses and data about the posts as JSON files

* [Tags](./tags/index.json) of the blog
* [Wikidata URIs](./wikidata/index.json) for posts in the blog
