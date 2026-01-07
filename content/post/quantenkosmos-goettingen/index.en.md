---
date: 2025-03-26T07:00:44+02:00
title: "Quantum cosmos Göttingen"
description: "A digital exhibit"
cite: true
tags:
  - Exhibition
  - Website
  - Geodata
  - JavaScript
  - Göttingen
  - History
  - OpenStreetMap
preview: screenshot.png
wikidata:
  - https://www.wikidata.org/wiki/Q464980
  - https://www.wikidata.org/wiki/Q1144457
  - https://www.wikidata.org/wiki/Q112061919
  - https://www.wikidata.org/wiki/Q936
  - https://www.wikidata.org/wiki/Q136992263
  - https://www.wikidata.org/wiki/Q1329181
  - https://www.wikidata.org/wiki/Q67078785
---

Today (26 March) is the opening of the exhibition [‘Was zum Quant?!’](https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/) in the Forum Wissen. You can also see a digital exhibit in which I was involved...
<!--more-->

The installation "Quantum cosmos Göttingen" shows the places where quantum physicists lived and worked in Göttingen from the summer semester of 1921 to the winter semester of 1936/36. The underlying city map is freely scalable, and the timeline at the bottom allows you to select the semester.
Comparable to Europeana.4D, GeoTemCo, or the Dariah GeoBrowser...

The data was collected by Pia Denkmann, the geodata enrichment, JSON transformation and the web frontend are by me. The texts were written by Christine Nawa and Ramona Dölling. The integration into the exhibition was carried out by the agency [Cognitio](https://www.cognitio.de/).

{{< gallery >}}
[
  {"src": "screenshot.png", "alt": "Screenshot of the prototype"}
]
{{</ gallery >}}

# Technical details

The map was georeferenced using QGIS.

The coordinates of the addresses are determined using [Nominatim](https://nominatim.openstreetmap.org/) from the OpenStreetMap project.

# Update

{{< figure src="final.jpeg" alt="Final version" class="post-image" caption="Adapted to the exhibition graphics" >}}
