---
date: 2024-03-05T19:22:44+02:00
title: "VintageReality gestartet"
keywords: "Stereoskopie, Anaglyphen"
description: "Die Sammlung an alten 3D Bildern hat nun ihr eigenes Blog"
preview:
  image: screenshot.png
  hide: true
tags:
  - Projektemacher.org
  - Blog
  - Light
  - 3D
  - DigitalImages
  - OpenCV
---

Das neueste Kind der [Projektemacher Labs](https://labs.projektemacher.org/) ist die seit Anfang 2023 ausgebaute Kategorie "1900 in 3D"...

<!--more-->

[VintageReality](https://vintagereality.projektemacher.org/) soll in der Zukunft alte stereoskopische Bilder in verschiedenen Darstellungsarten präsentieren.

{{< zoom-link link="https://vintagereality.projektemacher.org/" title="VintageReality" >}}
    {{< figure src="screenshot.png" alt="Screenshot VintageReality" class="post-image" >}}
{{< /zoom-link >}}

# Präsentation

Um die Präsentation mit verschiedenen Brillen und Techniken zu ermöglichen, sind neben der IIIF Präsentation auch zusätzliche Format bzw. Repräsentationen verfügbar:

{{< figure src="img/image-tabs.jpg" alt="Derivate" class="post-image" >}}

## Beispiele

{{< gallery >}}
[
  {"src": "img/front-anaglyph.jpg", "alt": "Anaglyph"},
  {"src": "img/front-depthmap.jpg", "alt": "Tiefenkarte"},
  {"src": "img/front.gif", "alt": "Wigglegram"}
]
{{</ gallery >}}

* [Anaglyphe](https://de.wikipedia.org/wiki/Anaglyph_3D)
* Tiefenkarte
* Wackelbild, eng. [Wigglegram](https://en.wikipedia.org/wiki/Wiggle_stereoscopy) (Beide Bilder als animiertes Gif mit schnellem Wechsel)

Die Seite bietet zusätzlich u.a. zusätzliche Derivate:
* [MPO](https://de.wikipedia.org/wiki/Multi_Picture_Object).
* Vollbild - für die Betrachtung mit einem [Cardboard VR](https://de.wikipedia.org/wiki/Google_Cardboard) (oder ähnlich) Betrachter.

# Umsetzung

Die verschiedenen Derivate wurde teilweise mit Hilfe von [StereoscoPy](https://github.com/2sh/StereoscoPy) erstellt, für die Berechnung Tiefeninformationen wurde [OpenCV](https://opencv.org/) verwendet.
