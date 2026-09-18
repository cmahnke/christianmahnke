---
date: 2025-07-27T18:22:44+02:00
title: "Fliiifenleger - eine IIIF Experimentierplattform"
keywords:
cite: true
tags:
- IIIF
- DigitalImages
- Java
wikidata:
  - https://www.wikidata.org/wiki/Q72885392
  - https://www.wikidata.org/wiki/Q214856
  - https://www.wikidata.org/wiki/Q484140
  - https://www.wikidata.org/wiki/Q148443
  - https://www.wikidata.org/wiki/Q121923035
  - https://www.wikidata.org/wiki/Q136933249
  - https://www.wikidata.org/wiki/Q106239881
lastmod: 2026-09-09T00:00:00+02:00
---

{{< figure src="Fliiifenleger.svg" alt="Fliiifenleger Logo" class="center" >}}

Es wurde Zeit für einen experimentellen IIIF Tiler...
<!--more-->

In der Vergangenheit habe ich einige Experimente mit der IIIF Image API gemacht, Beispiele sind:

* [JPEG XL](https://christianmahnke.de/post/jpeg-xl/),
* [IIIF Proxy](https://christianmahnke.de/post/iiif-proxy/),
* [HDR IIIF](https://christianmahnke.de/post/hdr-iiif/)

Dafür habe ich teilweise bestehende Implementierungen erweitert. Da das aber entweder recht langsam wurde oder nicht wirklich intuitiv, habe ich mich entschieden eine eigene "Plattform" zu bauen:

## Fliiifenleger

`fliiifenleger` ist ein Java-basiertes Kommandozeilen-Tool zur Erzeugung und Validierung von statischen IIIF-Bildern (International Image Interoperability Framework).

Es verarbeitet lokale Bilddateien, um IIIF-konforme Kachelstrukturen und die zugehörige `info.json`-Datei zu erstellen.

Das Tool bietet Befehle wie `generate` zum Erstellen von Kacheln, `validate` zur Überprüfung von IIIF-Endpunkten und `info` zur Anzeige von Systeminformationen.

Eine besondere Funktion ist die Möglichkeit, Bildprozessoren zu verketten, um beispielsweise Filter vor der Kachelung anzuwenden. Zusätzlich ist die Serialisierung (also das Speichern der erstellten Kacheln) erweiter- und austauschbar.

*Der Name ist übrigens ein Spiel mir der visuellen Ähnlichkeit von kleinem [langen S](https://de.wikipedia.org/wiki/Langes_s) und F in Frakturschriften.*

**Der Code ist auf [GitHub](https://github.com/cmahnke/fliiifenleger) verfügbar.**

# Update 9.9.2026

Inzwischen ist eine Version 0.2.0 erscheinen, diese bietet nun Integrationen für Ideen aus anderen Beiträgen:
* C2PA - [Blog Beitrag](https://christianmahnke.de/post/digital-provenance/)
* HDR JPEG (UltraHDR) - [Blog Beitrag](https://christianmahnke.de/en/post/hdr-iiif/)

Zusätzlich gibt es eine einfache [Projektseite](https://cmahnke.github.io/fliiifenleger/).
