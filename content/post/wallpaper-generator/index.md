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
- JavaScript
wikidata:
- https://www.wikidata.org/wiki/Q191529
---

Da ich eine [umfangreiche Sammlung an gemusterten Papieren](https://vorsatzpapier.projektemacher.org/patterns/) habe, war es Zeit damit etwas zu machen...

<!--more-->
Seit Corona ist es üblich, einander in Videokonferenzen in die Buden zu schauen. Während es einige mit interessanten Perspektiven oder dem Schwarz-Weiß-Modus probierten, wurde es während des darauf folgendem KI-Boom üblich mittels Filter Hintergründe weichzuzeichnen, damit man sich keine exzentrische Gitarren-, Fahrrad- oder Kunstsammlung an die Wand schrauben muss.

Und um beides zusammen zu bringen, gibt es nun eine interaktives Spielzeug für das ["Vorsatzpapier" Blog](https://vorsatzpapier.projektemacher.org/generator/), einen Mustergenerator, der direkt mit den bereitgestellten IIIF Manifesten arbeiten kann. Auf dieser Seite gibt es eine Variante, bei der das Ausgangsmaterial frei gewählt werden kann, indem man die URL zu einem IIIF-Manifest einträgt.

{{< lucienne uselocation=true src=`[{"label": "Sammlung Vorsatzpapier", "url": "https://vorsatzpapier.projektemacher.org/patterns/collection.json"}]` urlinput=true resize=true download=true >}}

# Bedienungsanleitung

**Wichtig**: Die Darstellung in mobilen Browsern kann gestaucht oder fehlerhaft sein.

In das obere Feld kann entweder eine URL zu einem IIIF-Manifest eingetragen werden, oder die [Sammlung an Tapeten und Vorsatzpapieren](https://vorsatzpapier.projektemacher.org/patterns/) genutzt werden. Je nach Art des Manifests erscheint daraufhin die Möglichkeit ein Objekt bzw. eine Seite eines Objektes auszuwwählen. Falls z.B. nur eine einzelne Seite vorhanden ist, wird dies automatisch ausgewählt.

Daraufhin erscheint das gewünschte Digitalisat in der Mitte.

Im nächsten Schritt können nun die Schnittmarken an den Rändern genutzt werden, um den passenden Ausschnitt zu wählen. Das Icon mit dem Qudrat erzeugt einen quadratischen Zuschnitt. Die Räder unten rechts können genutzt werden um eine alternierende Rotation um den eingestellten winkel entweder horizontal oder vertikal einzustellen.

Im unteren Fenster erhält man eine Vorschau auf das Ergebnis. Zusätzlich ist es möglich die Anzahl der Zeilen und Spalten einzustellen. Nach einer Änderung muss auf "Größe aktualisieren" geklickt werden. Auch ist es hier möglich das Ergebnis herunterzuladen. Dabei wird der Inhalt immer auf die Breite der gewälten Auflösung skaliert. Das Symbol mit den zwei Pfeilen auf der linken Seite kann genutzt werden, um den Inhalt so breit wie das Vorschaufenster zu machen.

# Lucienne Day

Der Name der Software soll an die Designerin [Lucienne Day](https://de.wikipedia.org/wiki/Lucienne_Day), die auch für ihre Textil und Tapeten Entwürfe der 50er und 60er Jahre berühmt wurde.

# Technische Details

Für die Umsetzung kamen unter anderem die folgenden JavaScript Module zum Einsatz:
* [OpenSeadragon](https://openseadragon.github.io/)
* [OpenSeaDragon - FabricJS Plugin](https://github.com/brunoocastro/openseadragon-fabric)
* [Allmaps iiif-parser](https://allmaps.org/)
* [Fabric.js](https://fabricjs.com/)
* [i18next](https://www.i18next.com/)
* [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector)

# Update 17.06.25

* Bedienungsanleitung hinzugefügt
