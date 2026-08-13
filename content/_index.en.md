---
displayinlist: false
news: false
archive: false
description: ""
title: Blog
outputs:
  - html
cascade:
  - target:
      kind: '{page,section}'
      sites:
        matrix:
          languages: [en]
      path: '**'
    params:
      outputs:
        - bibtex
        - html
---
