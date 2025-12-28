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

2024 ist meine Stereoskopie-Sammlung online gegangen...
<!--more-->

...zumindest [teilweise](https://vintagereality.projektemacher.org/). Einige Teile der Sammlung warten immer noch darauf digitalisiert zu werden. Während die Derivate damals noch mittels "klassischer" Computer-Vision-Algorithmen [erzeugt](https://christianmahnke.de/post/vintagereality/) wurden, habe ich mich aus aktuellem Anlass (dazu demnächst mehr) mich nun noch einmal mit KI dem Problem genähert.

Im ersten Schritt wurden Trainingsdaten benötigt. Die eigenen Bestände waren dafür nicht ausreichend, aber zum Glück sind die Karten in der Regel über hundert Jahre alt und daher nicht mehr dem Urheberrecht unterworfen. Verschiedene Institutionen haben entsprechende Sammlungen digitalisiert:
* [Tennessee Virtual Archive](https://teva.contentdm.oclc.org/customizations/global/pages/index.html)
* [New York Public Library Digital Collections](https://digitalcollections.nypl.org/)
* [The Huntington Library](https://hdl.huntington.org/)

Die Trainingsdaten wurden mit [Labels Studio](https://labelstud.io/) ausgezeichnet und sind ebenfalls frei [verfügbar](https://github.com/cmahnke/vintagereality-tools/tree/main/data).

Danach wurde ein [YOLO11-Bildsegmentierungsmodell](https://docs.ultralytics.com/tasks/segment/) damit trainiert.

## Beispiel

Die Ergebnisse für den Beitrag [Empfangssaal des Maharajah von Tangore in Calcutta, Indien](https://vintagereality.projektemacher.org/post/calcutta/):

{{< gallery >}}
[
  {"src": "img/calcutta.jpg", "alt": "Digitalisat der Karte"},
  {"src": "img/seperated.png", "alt": "Segmentierung"},
  {"src": "img/segmented.png", "alt": "Ausgeschnittene Halbbilder"}
]
{{</ gallery >}}


## Download

Das Modell selbst ist auf [Hugging Face](https://huggingface.co/cmahnke/vintagereality) zum Download verfügbar.
