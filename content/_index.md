---
params:
  displayinlist: false
  news: false
  archive: false
description: ""
title: Blog
outputs:
  - iiif-collection
  - html
  - rss
  - jsonfeed
  - following
  - activity-pub-outbox
  - bibtex
  - llms
cascade:
  - target:
      kind: '{page,section}'
      sites:
        matrix:
          languages: [de]
      path: '**'
    params:
      outputs:
        - bibtex
        - html
---
