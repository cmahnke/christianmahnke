---
date: 2022-01-26T11:44:44+02:00
title: "IIIF Proxy"
tags:
  - IIIF
  - OpenCV
  - DigitalImages
---

Zur Verbesserung der "Ausstellbarkeit" digitaler Objekte, wie Münzen und Büchern habe ich einen Proxy für IIIF-Ressourcen geschrieben...
<!--more-->

Die digitalen Sammlungen der Uni Göttingen speisen sich hauptsächlich aus zwei Portalen:
* [Wissenschaftliche Sammlungen der Georg-August-Universität Göttingen](https://sammlungen.uni-goettingen.de/index/)
* [Göttinger Digitialisierungszentrum](https://gdz.sub.uni-goettingen.de/)

Beide stellen ihre Digitalisate über [IIIF](https://iiif.io/) bereit. Leider sind die bereit gestellten Bilder aber nicht für eine ästhetisch ansprechende Zweitverwendung optimiert.

Um nun eine manuelle Nachbearbeitung und den daraus folgenden Speicheraufwand gering zu halten, habe ich einen bestehenden IIIF Server - [Hymir vom MDZ](https://github.com/dbmdz/iiif-server-hymir/) - etwas erweitert, so dass er in der Lage ist sich auf einen institutionellen Server zu setzen und die von diesem ausgelieferten Bilder umzugestalten.

Um die Bildverarbeitung konfigurierbar zu halten, wird ein Feld der IIIF Image API genutzt um die Operation zu spezifizieren. Dafür bot sich das Feld [`quality`](https://iiif.io/api/image/2.1/#quality) an, der Proxy erlaubt:
* `nofold` - Seitenfalz entfernen
* `transparent-background` - Transparenter Hintergund
* `nofold+transparentbg` - beide zusammen

Für die Bildoperationen selbst kommt [OpenCV](https://opencv.org/) zum Einsatz, dabei wird der Hintergrund einfach mit einem Schwellwert und nur an den Rändern entfernt - also transparent gemacht. Die Erkennung der Falzist etwas komplizierter, aber auch kein Hexenwerk:
* Erkennung von Linien ([Probabilistic Hough Line Transform](https://de.wikipedia.org/wiki/Hough-Transformation)) im Falzbereich je nach Links- oder Rechtsseitigkeit
* Sortierung der erkannten Linien nach Winkel und Länge um den wahrscheinlichsten Kandidaten für die Falz zu finden
* Rotation um die erkannte Falz vertikal auszurichten

Aber hier könnte die Zuverlässigkeit noch etwas erhöht werden.

# Beispiele

Die folgende Beispiele zeigen Digitalisate im jeweiligen Portal und im Viewer des Proxies. Der Viewer des Proxies erlaubt das Ändern der Hintergrundfarbe, um den Kontrast erhöhen zu können. In den Beispielen ist ein blauer Hintergrund voreingestellt.

## Transparenter Hintergrund

{{< gallery >}}
[
  {"src": "img/Sammlungsportal-record_DE-MUS-062622_kenom_127703.png", "alt": "Vorher"},
  {"src": "img/Proxy-record_DE-MUS-062622_kenom_127703.png", "alt": "Nachher"}
]
{{</ gallery >}}

[Original Eintrag im Portal](https://sammlungen.uni-goettingen.de/objekt/record_DE-MUS-062622_kenom_127703/)

<div class="small-font-right">
Abbildung: Münzkabinett der Universität Göttingen, Stephan Eckardt, Archäologisches Institut Göttingen, 2014 / Lizenz: Namensnennung - Nicht kommerziell 4.0 (CC BY-NC 4.0)
</div>

## Ohne Falz

{{< gallery >}}
[
  {"src": "img/GDZ-DE-611-HS-3461927_00000016.png", "alt": "Vorher"},
  {"src": "img/Proxy-DE-611-HS-3461927_00000016.png", "alt": "Nachher"}
]
{{</ gallery >}}

[Original Eintrag im Portal](https://gdz.sub.uni-goettingen.de/id/DE-611-HS-3461927?tify=%7B%22pages%22%3A%5B16%5D%2C%22view%22%3A%22info%22%7D)

<div class="small-font-right">
Abbildung: Niedersächsische Staats- und Universitätsbibliothek Göttingen / Lizenz: Public Domain Mark 1.0 (PDM)
</div>

<br>

Das Projekt ist auf [GitHub](https://github.com/cmahnke/iiif-proxy) verfügbar.

# Update 11.4.22

Aus zeitlichen Gründen wird das Projekt wird erstmal nicht fortgeführt, zumal das Upstream Projekt gerade nichts sehr aktiv ist...
