---
displayinlist: false
news: false
archive: false
description: ""
title: Blog
outputs:
  - iiif-collection
  - html
  - rss
  - activity-pub-outbox
  - bibtex
  - llms
cascade:
  - _target:
      kind: '{page,section}'
      lang: de
      path: '**'
    params:
      outputs:
        - bibtex
        - html
---
