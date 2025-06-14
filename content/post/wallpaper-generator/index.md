---
date: 2025-06-09T23:22:44+02:00
title: "Virtuelle Räume tapezieren!"
preview:
  image: screenshot.png
  hide: true
cite: true
tags:
- Projektemacher.org
- Blog
- IIIF
- DigitalImages
- Fun
wikidata:
- https://www.wikidata.org/wiki/Q191529
---

Da ich eine umfangreiche Sammlung an gemusterten Papieren habe, war es Zeit damit etwas zu machen...

<!--more-->
Seit Corona ist es üblich, einander in Videokonferenzen in die Buden zu schauen. Während es einige mit interessanten Perspektiven oder dem Schwarz-Weiß-Modus probierten, wurde es während des darauf folgendem KI-Boom üblich mittels Filter Hintergründe weichzuzeichnen, damit man sich keine exzentrische Gitarren-, Fahrrad- oder Kunstsammlung an die Wand schrauben muss.

Und um beides zusammen zu bringen, gibt es nun eine interaktives Spielzeug für das ["Vorsatzpapier" Blog](https://vorsatzpapier.projektemacher.org/generator/), einen Mustergenerator, der direkt mit den bereitgestellten IIIF Manifesten arbeiten kann. Auf dieser Seite gibt es eine Variante, bei der das Ausgangsmaterial frei gewählt werden kann.:

{{< lucienne uselocation=true src=`[{"label": "Sammlung Vorsatzpapier", "url": "https://vorsatzpapier.projektemacher.org/patterns/collection.json"}]` urlinput=true resize=true download=true >}}

Der Name der Software soll an die Designerin [Lucienne Day](https://de.wikipedia.org/wiki/Lucienne_Day), die auch für ihre Textil und Tapeten Entwürfe der 50er und 60er Jahre berühmt wurde.


# Technische Details

Für die Umsetzung kamen unter anderem die folgenden JavaScript Module zum Einsatz:
* [OpenSeadragon](https://openseadragon.github.io/)
* [OpenSeaDragon - FabricJS Plugin](https://github.com/brunoocastro/openseadragon-fabric)
* [Allmaps iiif-parser](https://allmaps.org/)
* [Fabric.js](https://fabricjs.com/)
* [i18next](https://www.i18next.com/)
* [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector)
