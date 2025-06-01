---
displayinlist: false
news: false
archive: false
description: ""
title: Blog
outputs:
  - html
cascade:
  - _target:
      kind: '{page,section}'
      lang: en
      path: '**'
    params:
      outputs:
        - bibtex
        - html
---
