---
date: 2024-04-15T13:58:44+02:00
title: "DIY Projekt: Pong Visualisierung"
tags:
- DIY
- Light
- Licht2024
- Fun
- Retrocomputing
- DigitalImages
preview: pong-heatmap1.png
---

Aus irgendeinem Grund bin ich auf die Idee gekommen [Pong](https://de.wikipedia.org/wiki/Pong) zu visualisieren...
<!--more-->

Ich besitze eine kleine Sammlung alter Spielekonsolen von vor 1980. [Viele](https://de.wikipedia.org/wiki/Liste_festverdrahteter_Heimvideospielkonsolen) davon basieren auf dem [AY-3-8500 Chip](https://de.wikipedia.org/wiki/AY-3-8500). Das bekannteste Spiel, das dieser Chip ermöglicht, ist Pong.

# Recherche

Nun könnte man natürlich zig Spiele machen, aufzeichnen, digitalisieren und dann visualisieren, aber das würde lange dauern, zumal man auch zwei Personen brauchen würde, das die alten Systeme kein Spiel gegen den Computer erlauben. Daher brauchte es eine automatisierbare Simulation. Folgende interessanten Projekte und Seiten sind mir bei der Recherche begegnet:

* [PONG-Story: Großartige Seite über Pong und frühe Konsolen](https://www.pong-story.com/)
    * [PONG-Story: Pong für den PC](https://www.pong-story.com/pcpong.htm)

* [OdysseyNow](https://pathealy.itch.io/odyssey-now-hal) - Basiert auf Unity

* Pong auf dem Arduino
    * [70's TV game recreation using an Arduino (Atmel ATmega328/168) processor.](http://searle.x10host.com/AVRPong/index.html) - Ausgiebige Dokumentation für eine originalgetreue Nachbildung
    * [Pong for Arduino](https://wolles-elektronikkiste.de/en/pong-for-arduino-computer-table-tennis) - eines von vielen weiteren Beispielen

* JavaScript Implementierung
    * [Javascript Pong von Jake Gordon](https://codeincomplete.com/games/pong/) - siehe unten

* Sonstige
    * [Pong Consoles Simulation](https://github.com/ThomasVisvader/Pong)

    * [POS (Pong Consoles) CPUs and Other Chips](https://emulation.gametechwiki.com/index.php/POS_(Pong_Consoles)_CPUs_and_Other_Chips) im [Emulation General Wiki](https://emulation.gametechwiki.com/index.php/Main_Page)

# Implementierung

Das Bild wurde auf Basis von [`typescript-pong`](https://github.com/adam-s/typescript-pong) generiert. Dieses Projekt ist ein Fork (bzw. TypeScript Port) von [`javascript-pong`](https://github.com/jakesgordon/javascript-pong) ist. Die [Dokumentation](https://codeincomplete.com/articles/javascript-pong/) für das Projekt ist sehr ausführlich, aber die TypeScript Variante ist einfacher anzupassen. Grundsätzlich waren nur infrastrukturelle Änderungen, z.B. ein nicht-interaktiven Modus, notwendig.

Dazu war ein einfacher Test auf Basis [Playwright](https://playwright.dev/) notwendig. Dadurch ließt sich das Aufzeichnen der Spiele im Browser und der jeweils Download des Mitschnitts automatisieren.

# Nachbearbeitung

Zur Erzeugung des Bildes auf Basis der Aufzeichnungen sind einige Nachverarbeitungsschritte notwendig:
* Videoeinzelbilder zusammen addieren, inspiriert von [`python-image-averaging`](https://github.com/mexitek/python-image-averaging)
* statische und dynamisch Bildanteile trennen
* Gammakorrektur der dynamischen Bereiche, um Unterschiede hervorzuheben, weichzeichnen, dann einfärben
* Bereiche wieder zusammenführen

Dabei kommen für die Bildoperationen [OpenCV](https://opencv.org/) und [NumPy](https://numpy.org/) zum Einsatz, für das Einfärben [Matplotlib](https://matplotlib.org/)

# Visualisierung

{{< gallery >}}
[
  {"src": "pong-heatmap1.png", "alt": "Pong Heatmap", "scalePreview": false}
]
{{</ gallery >}}

Auf dem Bild sind die statischen Bereiche weiß, wie auf dem Spielfeld, die farbigen Flächen zeigen, wie häufig in welchem Bereich des Bildes etwas passiert.

Die Verteilung folgt dieser Skala: Auf der linken Seite (Cyan) wenig Aktivität, rechts (Magenta) viel Aktivität.

<div style="content: ' '; display: block; width: 70%; height: 2rem; margin: auto; background: linear-gradient(90deg, rgba(0, 255, 255, 1) 0%, rgba(255, 0, 255, 1) 100%);"></div>

# Statistik

Das Bild besteht aus 1777136 Einzelbildern, bzw. 2:42 Stunden Spieldauer, bzw. 333 Runden.

# Update 9.9.2024

Ich bin nicht der einzige, der auf die Idee gekommen ist Pong für die Visualisierung einzusetzen: [Song Pong](https://victortao.substack.com/p/song-pong).

{{< html/iframe-consent  preview="<img class='video-preview' src='./videos/snakehandler-boxed.jpg' alt='Vorschau'>" >}}
    {{< youtube id="lxjElOAgkPg" title="Song Pong - Liszt - Hungarian Rhapsody No.8 in F sharp minor" >}}
{{< /html/iframe-consent >}}
