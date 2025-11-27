---
date: 2025-11-27T18:33:44+02:00
title: "HDR IIIF für alle mit VIPS"
keywords: libultrahdr, ultrahdr, Pillow, XMP, JPEGXL, vips
draft: true
cite: true
tags:
  - DigitalImages
  - Digitisation
  - HDR
  - IIIF
iiifContext: http://iiif.io/api/image/2/context.json
outputs:
- html
- iiif-manifest
resources:
- src: "front-hdr.jxl"
  name: front
  params:
    iiif: front-hdr/info.json
notes: Add https://iiif.io/api/image/3.0/#57-extra-functionality
---
HDR IIIF für alle...
<!--more-->
...wird die nächste Version von VIPS bieten. Dort wrde die funktionalität nun [hinzugefügt](https://github.com/libvips/libvips/pull/4745).

Wer es jetzt schon ausprobieren will, muss sich die aktuelle Entwicklungsversion aus dem Git Repository selber bauen.

[`libultrahdr`](https://github.com/google/libultrahdr), ein C-Compiler und `meson` müssn installiert sein. Unter MacOS mit [`brew`](https://brew.sh/): `brew install meson libultrahdr`

Falls man Unterstützung für mehr Bildformate braucht, bietet [diese Datei](https://github.com/libvips/libvips/blob/master/meson_options.txt) eine Übersicht über die verfügbaren Optionen.  Bereits installierte Bibliotheken in der Regel werden automatisch gefunden, ansonsten müssen weitere Bibliotheken installiert werden.

```
git clone --depth 1 https://github.com/libvips/libvips.git
cd libvips
meson setup build --prefix /usr/local -Duhdr=enabled
cd build
meson compile
meson test
meson install
```

Mit der kommenden Version (die in ein bis zwei Monaten erscheinen sollte) wird die Funktionalität dann auch über Paketmanager verfügbar sein...