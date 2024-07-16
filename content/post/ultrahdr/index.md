---
date: 2024-05-23T11:22:44+02:00
title: "LibUltraHDR"
tags:
  - Light
  - Licht2024
  - DigitalImages
  - HDR
---

Für ein in Vorbereitung befindliches Projekt war es nach der [Recherche](/post/hdr-awesome-list/) notwendig einige Wege zu erkunden und Werkzeuge zu schaffen. Ausgehend von den Vorarbeiten von [Greg Benz](https://gregbenzphotography.com/hdr/), zur HDR-Unterstützung, war LibUltraHDR der sinnvollste Kandidat für weitere Experimente.
<!--more-->

# LibUltraHDR

[LibUltraHDR](https://github.com/google/libultrahdr) ist primär eine Bibliothek für UltraHDR Inhalte. Das Format selber ist mit [MPO](https://en.wikipedia.org/wiki/JPEG#JPEG_Multi-Picture_Format) vergleichbar. Es existiert ein primäres Bild, hier ein SDR, dass auch als Fallback für Software ohne UltraHDR Unterstützung fungiert und in den Metadaten ein weiteres Bild, die sogenannte Gain Map. Diese bildet die auf das SDR anzuwendende Verstärkung ab. Mehr Informationen zur Funktionsweise von Gain Maps bietet [Adobe](https://helpx.adobe.com/camera-raw/using/gain-map.html).

Eine technische Dokumentation bietet [Android Developers](https://developer.android.com/media/platform/hdr-image-format?hl=de) (automatische Übersetzung von mäßiger Qualität).

## Status
Derzeit arbeiten Greg Benz und weitere daran bei relevanten Open Source Projekten um eine Unterstützung des Formats zu werben:
- [LibVips #3799](https://github.com/libvips/libvips/issues/3799)
- [ImageMagick #6377](https://github.com/ImageMagick/ImageMagick/issues/6377)
- [**Tev** #226](https://github.com/Tom94/tev/issues/226)
- [HDRImageViewer #66](https://github.com/13thsymphony/HDRImageViewer/issues/66)
- [`ffmpeg` #10974](https://trac.ffmpeg.org/ticket/10974)
- [Pillow #8036](https://github.com/python-pillow/Pillow/issues/8036)
- [CanIUse #6759](https://github.com/Fyrd/caniuse/issues/6759)
- [`libjxl` #2685](https://github.com/libjxl/libjxl/issues/2685)
- [Memories #1110](https://github.com/pulsejet/memories/issues/1110)

Es existieren auch einige erste Webseiten mit Unterstützung:
* [Gainmap Creator](https://gainmap-creator.monogrid.com/)
* [Demo für Konvertierung mittels `ffmpeg` und `libultrahdr`](https://github.com/albertz/playground/wiki/HDR-demo) von [Albert Zeyer](https://github.com/albertz)
* [`libultrahdr` and Python](https://github.com/albertz/playground/blob/master/ultrahdr.py), ebenfalls von Albert Zeyer

## Manuelle Konvertierung mit `ffmpeg`

Seit dem Release von Version 0.8 von `libultrahdr` haben sich die Kommandozeilenoptionen geändert, hier die aktuelle (Mai 2024) Fassung. Wichtig ist, dass:
* Die Abmessungen des Eingangsbildes bekannt sind (X, Y)
* Die Abmessung durch zwei teilbar (gerade) sind

Im ersten Schritt muss eine YUV Repäsentation des Eingangsbildes erzeugt werden, diese wird als Gain Map genutzt, also als Definition der Verstärkung.

```
ffmpeg -i input.jpg -filter:v format=p010 output.yuv
```

Im nächsten Schritt kann dann die erstellte Gain Map genutzt werden um das gewünschte Bild zu erzeugen:
```
ultrahdr_app -m 0 -p output.yuv -i input.jpg -w X -h Y -a 0
```

In den nächsten Monaten kann damit gerechnet werden, dass das etwas esoterische YUV Format entweder leichter erzeugt werden kann oder gänzlich drauf verzichtet werden kann.

## Docker Image

Es existiert nun auch ein Docker Image, dass die jeweils aktuellste Version von `libultrahdr` zusammen mit ImageMagick mit UltraHDR Unterstützung bereitstellt.

```
docker pull ghcr.io/cmahnke/hdr-tools:latest
```

# Nächste Schritte

Derzeit ist die HDR Unterstützung von HDR-Bildern und -Inhalten auf Chrome und davon abgeleitete Browser beschränkt, diese habe allerdings einen Marktanteil von 75%. Die [HDR Unterstützung von Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=hdr), oder besser der Weg dahin, ist eher peinlich - so werden nicht mal HDR Video-Formate voll unterstützt.

Für die Chrome-basierten Browsern allerdings soll es auch möglich sein, HTML Canvas Elemente mit HDR Inhalten zu bespielen.

# Update 6.7.24

Hier zwei Beispiele aus meinem Urlaub:

{{< hdr-check >}}

{{< gallery >}}
[
  {"src": "img/IMG_5255.hdr.jpeg", "alt": "Sonnenuntergang über Hörnum"},
  {"src": "img/IMG_5256.hdr.jpeg", "alt": "Sonnenuntergang auf Föhr"}
]
{{</ gallery >}}

HDR wird in der Vollbildansicht aktiviert.
