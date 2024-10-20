---
date: 2024-10-15T18:22:44+02:00
title: "Haptisches Feedback"
description: 'Eine Einzelseite aus "Textil-Atlas: ein Lehrbuch und Nachschlagebuch für den Textileinzelhandel und die Gewebeverarbeitung: Textilwarenkunde und Gewebemuster" von Wilhelm Spitschka fühlbar gemacht mit IIIF'
keywords: Touch, Berührung, Haptic Internet
tags:
- IIIF
- HapticFeedback
- DigitalImages
- JavaScript
outputs:
- html
- iiif-manifest
#iiifContext: http://iiif.io/api/presentation/2/context.json
resources:
- src: "page031.jxl"
  name: preview
  params:
    iiif: page031/info.json
    label: Tafel 31
---

Wieder ein Beitrag aus den Projektemacher Labs...

<!--more-->

...dank Corona nun endlich abgeschlossen:

Da es in diesem Blog auch darum gehen soll analoge Inhalte innovativ in den digitalen Raum zu transportieren, hier ein Versuch Stoffe fühlbar zu machen...

Vor einiger Zeit habe ich ein Stoffmusterbuch erworben:
<p class="reference">
Textil-Lexikon: Ein Lehrbuch und Nachschlagebuch für den Textileinzelhandel und die Gewebeverarbeitung von Wilhelm Spitschka, Franckh, Stuttgart 1928. <a class="worldcat" href="http://www.worldcat.org/oclc/249121078">&nbsp;</a>
</p>

Darin sind die Muster nicht einfach abgedruckt, sondern aufwendig ausgeschnitten und eingeklebt. Der entsprechende Eintrag findet sich bei [Blaufußtölpel](https://xn--blaufusstlpel-qmb.de/post/textil-atlas-1928/). Diese sollen mit diesem Beitrag auf eine neue Art erfühl und damit erfahrbar gemacht werden.

# Vorbereitung der Bilddaten

Der erste Schritt war die Vorbereitung der Bilddaten: Ausgangsbasis für taktiles Feedback sind die Bilddateien, sowie einer manuellen Markierungen für die Abschnitte (Bounding Box) mit Stoff.

Aus ihnen wurden mit etwas automatisierter Nachbearbeitung "Höheninformationen" gewonnen. Wobei es allerdings nur zwei Abstufungen gibt. Diese Schritte sind für jeden einzelnen Bildausschnitt konfigurierbar, nach der Bearbeitung wurde das Ergebnis nochmals gerastert, um eine Auflösung von fühlbarer Punkten zu erhalten, dabei wird eine Kantenlänge von 1mm verwendet, da das ungefähr der Auflösung einer menschlichen Fingerkuppe entspricht.

Als Beispiel dient hier der Cordsamt:

{{< figure src="./page031-1-cut.png" caption="Ausschnitt zur Analyse" >}}

{{< figure src="./page031-1-filter_0_FIND_EDGES.png" caption="Kantenerkennung" >}}

{{< figure src="./page031-1-filter_1_EDGE_ENHANCE.png" caption="Kantenverbesserung" >}}

{{< figure src="./page031-1-filter_2_SMOOTH_MORE.png" caption="Weichzeichnen 1" >}}

{{< figure src="./page031-1-filter_3_SMOOTH_MORE.png" caption="Weichzeichnen 2" >}}

{{< figure src="./page031-1-filter_4_GRAYSCALE.png" caption="Graustufen" >}}

{{< figure src="./page031-1-filter_5_EQUALIZE.png" caption="Mittelwert" >}}

{{< figure src="./page031-1-filter_6_BINARIZE.png" caption="Binarisieren" >}}

{{< figure src="./page031-1.png" caption="Reduktion auf eine Pixelkantenlänge von 1mm" class="img-center" >}}

<details>
  <summary>Beispiel: Das Ergebnis der Vorverarbeitung als JSON-Array</summary>
<pre>
{{< highlight json >}}
[
  [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,1,0,0,0,0,1,1,1,1,0,1,1,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,1,0,1,1,1,0,1,1],
  [0,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,0,1,1,0,1,1,1,0,1,1,1,1,0,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,0,0,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,1,1,1,0,1,1,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1],
  [0,0,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,1,1,0,0,1,0,1,1,1,0,1,0,0,1,0,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,0,0,1,0,1,1,0,1,1,1,1],
  [1,0,1,1,1,1,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,0,0,1,1,0,1,1,0,1,1,1,0,1,1,0,0,1,0,1,1,1,1,0,1,0,1,1,1,1,0,0,1,1,0,0],
  [1,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1],
  [1,1,1,1,0,0,1,1,0,0,1,1,1,0,0,1,0,1,1,1,0,0,0,1,0,0,1,0,0,1,0,0,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,0],
  [1,1,1,1,1,0,1,1,1,1,0,0,1,1,0,0,1,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,0,0,1,0,1,1,1,1],
  [1,1,1,1,0,1,1,1,1,1,1,0,1,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,0,1,1,1],
  [1,0,1,1,1,1,1,0,0,1,0,1,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1,1,1,1,0,0,0,1,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
  [0,0,1,1,0,1,1,1,1,1,0,0,1,0,0,0,1,0,1,1,0,0,1,0,0,0,0,0,0,1,0,1,1,0,0,1,0,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1],
  [0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,1,0,1,1,1,0,0,1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,0],
  [1,0,1,1,0,1,1,0,0,1,0,0,0,0,0,0,1,0,1,1,0,1,1,0,0,0,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,1,0],
  [1,0,1,1,0,1,1,0,0,1,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,0,0,1,0,1],
  [1,1,1,1,0,1,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0],
  [0,1,1,1,0,1,1,0,1,1,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,1,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1],
  [0,1,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,1,0,0,0,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1],
  [0,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,0,1,1,1,0,1,1,0,1,1,1,0,1],
  [1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,0,0,0,1,0,1,0,0,1,1,0,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,0,1],
  [0,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,0,1,0,1,1,1,0,1,0,0,1,0,0,1,1],
  [1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,0,1,1,0,1,1,0,0,1,0,1,1,0,0,1,0,0,1,1,1,1,1,1,1,1],
  [1,0,1,1,0,0,1,0,1,0,0,1,1,0,1,1,0,0,0,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,1,0,1,1],
  [1,1,1,1,0,0,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,1,1,1,0,1,1],
  [1,1,1,0,0,1,1,0,0,1,0,1,0,0,0,1,1,0,1,0,0,1,1,0,1,1,0,0,1,1,0,1,0,1,1,1,0,0,1,0,1,0,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,1],
  [1,1,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,0,1,1,1,1,0,1,1,0,0,0,1],
  [1,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,0,1,1,1,1,1,0,0,1,1,0,0,0],
  [1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,1,0,0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1],
  [1,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,0,1],
  [1,1,1,0,1,0,0,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1],
  [1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,0,1],
  [1,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,0,1],
  [0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,1,1,1,0,0,0,0,1,1,0,1,0,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,0],
  [1,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,1,0,1,0,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,0,0,1],
  [1,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1],
  [1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,1,1],
  [1,0,1,1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,0,1,1,1,1,1,1,1,0,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1]
]
{{< / highlight >}}
</details>

# Präsentation

Damit sich die erzeugte Datenstruktur mit dem Digitalisat, in der gewohnten Funktionalität (z.B. Zoom) einbinden lies, musste sie  Teil des IIIF Manifestes werden. In einem Manifest lassen sich über Annotationen Bezüge zwischen beschreibenden Daten und Bildregionen herstellen, das Verfahren kam auch hier zum Einsatz.

Dafür war allerdings ein weiterer Datenaufbereitungsschritt notwendig: Selbst wenn man fast die Hälfte der Punkte verwerfen würde, da sie keine notwendigen Informationen (im Beispiel oben "0") beinhalten, blieben immer noch 1232 Punkte über. Daher wurden die zusammenhängenden Bereiche zusammengefasst und dabei darauf geachtet, dass keine "Löcher" geschlossen wurden. Am Ende dieser Optimierung blieben 120 Bereiche über, die als SVG Polygone repräsentiert sind:

{{< figure src="./single.jpg" caption="Darstellung als einzelne Quadrate" >}}

{{< figure src="./merged.jpg" caption="Darstellung Polygone" >}}

Diese SVG Polygone ließen sich dann in [Webannotationen](https://www.w3.org/TR/annotation-model/) übersetzen und so direkt in das IIIF Manifest einbetten. Da ein solcher Inhaltstyp bisher nicht vorgesehen ist, musste er noch definiert werden.

<details>
  <summary>Beispiel: Das zweite Polygon als Annotation</summary>
  {{< highlight json >}}
  {
    "id": "http://localhost:5173/canvas/page031/annotation/0/touch/1",
    "type": "Annotation",
    "motivation": "sensing",
    "body": {
      "id": "http://localhost:5173/canvas/page031/annotation/0/touch/1/body",
      "type": "InteractiveResource",
      "haptics": { "vibrate": true }
    },
    "target": {
      "type": "SpecificResource",
      "source": "http://localhost:5173/canvas/page031",
      "selector": {
        "type": "SvgSelector",
        "value": "<svg  xmlns=\"http://www.w3.org/2000/svg\"><polygon points=\"805,596 806,596 829,596 853,596 853,572 829,572 806,572 805,572 782,572 758,572 758,596 782,596\" /></svg>"
      }
    }
  }
  {{< / highlight >}}

  Die notwendige Extension ist [hier](https://christianmahnke.de/iiif/touch/) definiert.
</details>

Zur Darstellung kommt hier dann [OpenSeadragon](https://openseadragon.github.io/) zusammen mit [Annotorious](https://annotorious.dev/) zum Einsatz.

# Ergebnis

"Leider" wird die Vibrate API nicht von allen Browsern unterstützt. Der erfolgversprechendste Kandidat ist sicher Chrome auf Android, aber auch da müssen ein paar Rahmenbedingungen beachtet werden:
* Vibration muss aktiviert sein
* Ton muss aktiviert sein
* Der Stromsparmodus deaktiviert sein

Getestet mit Chrome auf Android 12, 13 und 14.

Weitere potentielle Browser listet [Can I Use](https://caniuse.com/vibration) auf, es existiert auch eine Testseite vom [Chrome Projekt auf Github](https://googlechrome.github.io/samples/vibration/).

{{< vibrate-check >}}

{{< iiif/touch-iiif manifestUrl="manifest-enriched.json" >}}

<a class="iiif-link" href="./manifest-enriched.json">IIIF-Manifest</a>

# Genutzte Bibliotheken

* Bild- und Datenaufbereitung
  * [`jxlpy`](https://github.com/olokelo/jxlpy)
  * [VIPS](https://www.libvips.org/)
  * [Pillow](https://python-pillow.org/)
  * [IIIF-Prezi3](https://iiif-prezi.github.io/iiif-prezi3/)
  * [Shapely](https://shapely.readthedocs.io/en/stable/)

* Darstellung
  * [OpenSeadragon](https://openseadragon.github.io/)
  * [Annotorious](https://annotorious.dev/)
  * [Manifesto](https://github.com/IIIF-Commons/manifesto)
