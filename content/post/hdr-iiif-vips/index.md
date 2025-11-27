---
date: 2025-11-27T18:33:44+02:00
title: "HDR IIIF für alle mit VIPS"
keywords: libultrahdr, ultrahdr, JPEGXL, vips
cite: true
tags:
  - DigitalImages
  - VIPS
  - HDR
  - IIIF
iiifContext: http://iiif.io/api/image/2/context.json
outputs:
- html
- iiif-manifest
wikidata:
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q7907037
  - https://www.wikidata.org/wiki/Q22682088
  - https://www.wikidata.org/wiki/Q11223506
---
HDR IIIF für alle...
<!--more-->
...wird die nächste Version von VIPS bieten. Dort wurde die Funktionalität nun [hinzugefügt](https://github.com/libvips/libvips/pull/4745). Damit braucht man keinen [eigenen Image-Tiler für HDR](/post/hdr-iiif/) mehr.

Wer es jetzt schon ausprobieren will, muss sich die aktuelle Entwicklungsversion aus dem Git Repository selber bauen.

[`libultrahdr`](https://github.com/google/libultrahdr), ein C-Compiler und `meson` müssen installiert sein. Unter MacOS mit [`brew`](https://brew.sh/): `brew install meson libultrahdr`

Falls man Unterstützung für mehr Bildformate braucht, bietet [diese Datei](https://github.com/libvips/libvips/blob/master/meson_options.txt) eine Übersicht über die verfügbaren Optionen.  Bereits installierte Bibliotheken in der Regel werden automatisch gefunden, ansonsten müssen weitere Bibliotheken installiert werden.

```
git clone --depth 1 https://github.com/libvips/libvips.git
cd libvips
meson setup build --prefix /usr/local -Duhdr=enabled
cd build
meson compile
meson test
sudo meson install
```

Dann kann man mit dem folgenden Kommando IIIF-Pyramiden für HTML erstellen:

```
vips dzsave $IMAGE_FILE $TARGET_DIR --keep gainmap --tile-size=512 --layout iiif
```

Derzeit fehlt aber noch ein Metadatum in der `info.json`-Datei um anzuzeigen das es sich um ein HDR-Bild handelt. Und die großen Viewer unterstützen die Anzeige auch noch nicht, mehr in dem [alten Beitrag](/post/hdr-iiif/).

Mit der kommenden Version (8.18.0 - die in ein bis zwei Monaten erscheinen sollte) wird die Funktionalität dann auch über Paketmanager verfügbar sein...
