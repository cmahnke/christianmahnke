---
title: Graphic by an artist from Spandau
params:
  metaPage: true
  displayinlist: false
  iiifContext: http://iiif.io/api/image/2/context.json
  linkedart:
    title: Flamingo
    artist:
      wikidata: https://www.wikidata.org/wiki/Q137662135
    owner:
      - wikidata: https://www.wikidata.org/wiki/Q28737496
      - wikidata: https://www.wikidata.org/wiki/Q137668638
        until: 2024-11-15
  wikidata:
    - https://www.wikidata.org/wiki/Q137662135
    - https://www.wikidata.org/wiki/Q28737496
weight: 2
tags:
  - Etching
outputs:
  - bibtex
  - html
  - linkedart
  - iiif-manifest
resources:
- src: "front.jxl"
  params:
    iiif: front/info.json
    hint: non-paged
    label: Druck
---

A graphic by the Spandau artist Fritz Neumann

<!--more-->

After Mr Schuth from the archive of the Spandau City History Museum provided me with the [key hint](/post/ric-unknownartist/) to Fritz Neumann, also known as [Ric](https://ric-unknownartist.projektemacher.org/), it was time to give one of his works to a cultural institution in his hometown.

{{< iiif/iiif contextPath="/collections/donations/spandau" src="front/info.json" share="false" >}}
