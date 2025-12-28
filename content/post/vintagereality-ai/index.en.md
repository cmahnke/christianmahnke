---
date: 2025-12-28T10:22:44+02:00
title: "KI Segmentierung für Stereoskopie-Karten"
keywords: "Stereoskopie, Anaglyphen"
description: "Die Sammlung an alten 3D Bildern hat nun ihr eigenes Blog"
cite: true
tags:
  - AI
  - 3D
  - DigitalImages
  - OpenCV
  - Stereoscopy
wikidata:
  - https://www.wikidata.org/wiki/Q35158
  - https://www.wikidata.org/wiki/Q484031
---

In 2024, my stereoscopy collection went online...
<!--more-->

...at least [partially](https://vintagereality.projektemacher.org/). Some parts of the collection are still waiting to be digitised. While the derivatives were originally [generated](https://christianmahnke.de/post/vintagereality/) using "classic" computer vision algorithms, I have now revisited the problem using AI for current reasons (more on that soon).

The first step was to obtain training data. My own holdings were not sufficient for this, but fortunately, the cards are usually over a hundred years old and therefore no longer subject to copyright. Various institutions have digitised corresponding collections:
* [Tennessee Virtual Archive](https://teva.contentdm.oclc.org/customizations/global/pages/index.html)
* [New York Public Library Digital Collections](https://digitalcollections.nypl.org/)
* [The Huntington Library](https://hdl.huntington.org/)

The training data was labelled with [Labels Studio](https://labelstud.io/) and is also freely [available](https://github.com/cmahnke/vintagereality-tools/tree/main/data).

A [YOLO11 image segmentation model](https://docs.ultralytics.com/tasks/segment/) was then trained with it.

## Example

The results for the entry [Reception hall of the Maharajah of Tangore in Calcutta, India](https://vintagereality.projektemacher.org/post/calcutta/):

{{< gallery >}}
[
  {"src": "img/calcutta.jpg", "alt": "Scan of the card"},
  {"src": "img/seperated.png", "alt": "Segmentation"},
  {"src": "img/segmented.png", "alt": "Cut-out half-images"}
]
{{</ gallery >}}


## Download

The model itself is available for download on [Hugging Face](https://huggingface.co/cmahnke/vintagereality).
