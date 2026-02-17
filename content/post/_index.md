---
title: "Blog"
metaPage: true
displayinlist: false
layout: blog
sitemap:
  changeFreq: daily
cascade:
  - target:
      kind: section
    params:
    sitemap:
      priority: 0.8
  - target:
      kind: page
    params:
      sitemap:
        priority: 0.6
      outputs:
        - bibtex
        - html
        - pdf
aliases:
  - blog
---

Hier gibt es in unregelmäßigen Abständen Beiträge (derzeit {{< post-count section="post" >}}) über meine Projekte, über die eingesetzten Technologien und neue Fundstücke.
Eine Übersicht über die letzten Beiträge in den jeweiligen Blogs gibt es bei [Projektemacher.org](https://projektemacher.org/posts/).
