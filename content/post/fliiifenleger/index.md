---
date: 2025-07-27T18:22:44+02:00
title: "Fliiifenleger - eine IIIF Experimentierplattform"
keywords:
cite: true
tags:
- IIIF
- DigitalImages
- Java
---

{{< figure src="Fliiifenleger.svg" alt="Fliiifenleger Logo" class="center" >}}

Es wurde Zeit für einen experimentellen IIIF Tiler...
<!--more-->

In der Vergangenheit ich einige Experimente mit der IIIF Image API gemacht, Beispiele sind:

* [JPEG XL](https://christianmahnke.de/post/jpeg-xl/),
* [IIIF Proxy](https://christianmahnke.de/post/iiif-proxy/),
* [HDR IIIF](https://christianmahnke.de/post/hdr-iiif/)


Dafür habe ich teilweise bestehende Implementierungen erweitert. Da das aber entweder recht langsam wurde oder nicht wirklich intuitiv, habe ich mich entschieden eine eigene "Plattform" zu bauen:

# Fliiifenleger

`fliiifenleger` ist ein Java-basiertes Kommandozeilen-Tool zur Erzeugung und Validierung von statischen IIIF-Bildern (International Image Interoperability Framework).

Es verarbeitet lokale Bilddateien, um IIIF-konforme Kachelstrukturen und die zugehörige `info.json`-Datei zu erstellen.

Das Tool bietet Befehle wie `generate` zum Erstellen von Kacheln, `validate` zur Überprüfung von IIIF-Endpunkten und `info` zur Anzeige von Systeminformationen.

Eine besondere Funktion ist die Möglichkeit, Bildprozessoren zu verketten, um beispielsweise Filter vor der Kachelung anzuwenden. Zusätzlich ist die Serialisierung (also das speichern der erstellen kacheln) erweiter- und austauschbar

*Der Name ist übrigens ein Spiel mir der visuellen Ähnlichkeit von kleinem [langem S](https://de.wikipedia.org/wiki/Langes_s) und F in Frakturschriften.*

**Der Code ist auf [GitHub](https://github.com/cmahnke/fliiifenleger) verfügbar.**
