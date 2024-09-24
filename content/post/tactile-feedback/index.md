---
date: 2020-12-04T18:22:44+02:00
title: "Haptisches Feedback"
description: 'Eine Einzelseite aus "Textil-Atlas: ein Lehrbuch und Nachschlagebuch für den Textileinzelhandel und die Gewebeverarbeitung: Textilwarenkunde und Gewebemuster von Wilhelm Spitschka"'
tags:
- IIIF
- TactileFeedback
draft: true
iiifContext: http://iiif.io/api/presentation/2/context.json
outputs:
- html
- iiif-manifest
resources:
- src: "page031.jpg"
  params:
    iiif: page031/info.json
    hint: non-paged
    label: Tafel 31
---

Da es in diesem Blog auch darum gehen soll analoge Inhalte innovativ in den digitalen Raum zu transportieren, hier ein Versuch Stoffe fühlbar zu machen...

<!--more-->

# Vorbereitung der Bilddaten

Diese Schritte sind konfigurierbar für jeden einzelnen Bildausschnitt, das Ziel ist die Überführung von Bilddaten in ein Raster von fühlbaren Punkten. Dabei muss noch experimentell ermittelt werden:

* Welche Kantenlänge jeder dieser Punkte haben soll - derzeit 1mm
* Wie viele Abstufungen von Intensität nützlich sind - derzeit nur 2 (An und Aus)

{{< figure src="./page031-1-cut.png" caption="Ausschnitt zur Analyse" >}}

{{< figure src="./page031-1-filter_0_FIND_EDGES.png" caption="Kantenerkennung" >}}

{{< figure src="./page031-1-filter_1_EDGE_ENHANCE.png" caption="Kantenverbesserung" >}}

{{< figure src="./page031-1-filter_2_SMOOTH_MORE.png" caption="Weichzeichnen 1" >}}

{{< figure src="./page031-1-filter_3_SMOOTH_MORE.png" caption="Weichzeichnen 2" >}}

{{< figure src="./page031-1-filter_4_GRAYSCALE.png" caption="Graustufen" >}}

{{< figure src="./page031-1-filter_5_EQUALIZE.png" caption="Mittelwert" >}}

{{< figure src="./page031-1-filter_6_BINARIZE.png" caption="Binarisieren" >}}

{{< figure src="./page031-1.png" caption="Reduktion auf eine Pixelkantenlänge von 1mm" >}}

# Das Ergebnis

Derzeit noch ohne Anreicherung.

{{< iiif/mirador manifestUrl="manifest.json" >}}
