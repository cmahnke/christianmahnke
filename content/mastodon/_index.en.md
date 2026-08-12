---
title: "Mastodon Archive"
metaPage: true
displayinlist: false
archive: false
news: false
sectionContent: false
layout: mastodon
cascade:
  - target:
      kind: '{page,section}'
      sites:
        matrix:
          languages: [en]
      path: '**'
    params:
      archive: false
      news: false
      sitemap:
        disable: true
---
