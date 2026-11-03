---
date: 2026-10-30T15:00:00+02:00
title: "IIIF und C2PA"
keywords: IIIF, Presentation API 3, C2PA
draft: true
tags:
  - IIIF
  - Digitisation
params:
  wikidata:
    - https://www.wikidata.org/wiki/Q121923035
    - https://www.wikidata.org/wiki/Q22682088
    - https://www.wikidata.org/wiki/Q1065865
---

Vor über einem Jahr gab es hier eine Idee: [C2PA für vertrauenswürdiges Digitalisiertes Kulturgut](https://christianmahnke.de/post/digital-provenance/)...

<!--more-->

... und nun gibt es den ersten Prototyp:


Die Umsetzung erfordert zwei Komponenten:
* Einen IIIF-Tiler, der die Bilder entsprechend anreichern kann. Dafür habe ich in den letzten Wochen [Fliiifenleger](https://cmahnke.github.io/fliiifenleger/) aktualisiert
* Ein Plugin für [Tify](http://tify.rocks/): [tify-plugin-c2pa](https://github.com/cmahnke/tify-plugins)

Zusätzlich gibt es eine kleine [Erweiterung für die Image API](https://christianmahnke.de/iiif/c2pa/).


Also technisch funktioniert es. Aber das ist mit Abstand der einfachste Teil für eine vollständige Umsetzung
