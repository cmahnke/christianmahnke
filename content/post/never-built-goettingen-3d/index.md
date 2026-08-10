---
date: 2026-08-10T23:30:44+02:00
title: 'Never Built Göttingen in 3D'
class: never
pagetheme: white
cite: true
tags:
  - Blog
  - Projektemacher.org
  - Architecture
  - Göttingen
  - UrbanPlanning
  - 3D
  - Geodata
  - OpenStreetMap
preview:
  image: img/screenshot.png
  hide: false
wikidata:
  - https://www.wikidata.org/wiki/Q8180985
  - https://www.wikidata.org/wiki/Q152838
  - https://www.wikidata.org/wiki/Q713750
  - https://www.wikidata.org/wiki/Q110609581
  - https://www.wikidata.org/wiki/Q116859588
---

Nachdem "Never Built Göttingen" im Frühjahr 2025 gestartet wurde, gibt es nun eine neue 3D-Visualisierung.
<!--more-->

Gegenüber dem Prototyp vom [November 2025](/post/patching-osm-data/) ist die Darstellung nun deutlich "schöner": Es gibt eine Kantenglättung und Bäume werden angezeigt. Auch die Aufbereitung der Daten ist deutlich ausgefeilter, sodass nun auch alternative Straßenverläufe dargestellt werden.

{{< zoom-link link="https://never-built.goettingen.xyz/3d-map/" title="Never Build Göttingen 3D" >}}
    {{< figure src="img/screenshot.png" alt="Screenshot Never Build Göttingen 3D" class="post-image" >}}
{{< /zoom-link >}}

Da derzeit nur ein Bruchteil der Gebäude als Modell vorliegt, handelt es sich lediglich um eine Vorschau, die auf der Seite selbst noch nicht verlinkt ist.

Für die Umsetzung kam [Planetier](https://github.com/onthegomap/planetiler) zur Erstellung der Vektor-tiles mit den Gbäuden und Bäumen und [Maplibe GL JS](https://maplibre.org/projects/gl-js/).
