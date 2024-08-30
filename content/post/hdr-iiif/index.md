---
date: 2024-08-18T11:33:44+02:00
title: "HDR IIIF"
tags:
  - Light
  - Licht2024
  - DigitalImages
  - HDR
  - IIIF
iiifContext: http://iiif.io/api/image/2/context.json
outputs:
- html
- iiif-manifest
resources:
- src: "front.hdr.jxl"
  name: front
  params:
    iiif: front.hdr/info.json
notes: Add https://iiif.io/api/image/3.0/#57-extra-functionality
---

Beim [Zeitzeug](http://www.zeitzeug.de/) wird die Tapetensammlung des Inhabers veräußert und ich habe mir ein besonders grelles Exemplar gesichert...
<!--more-->

Und da ich mit [Vorsatzpapier](https://vorsatzpapier.projektemacher.org/) ein Blog habe, dass auch alte Tapeten präsentiert, habe ich dieses digitalisiert. Nur leider kommt dabei der leuchtende Charakter nicht wirklich zum [Vorschein](https://vorsatzpapier.projektemacher.org/post/tapete-20/).

Das brachte mich auf die Idee mal zu versuchen ein [HDR](https://de.wikipedia.org/wiki/High_Dynamic_Range_Image) (bzw. [UltraHDR](https://developer.android.com/media/platform/hdr-image-format)) Bild in Form von IIIF bereitzustellen. Das Hauptproblem dabei war das zerlegen des Bildes in Kacheln, da gängige Werkzeuge dafür nur die SDR Repräsentation des Bildes heranziehen.

# Image Tiler für UltraHDR

Da meine Blogs am Anfang `iiif_static.py` aus dem Python Modul [`iiif`](https://github.com/zimeon/iiif) (dass sich aber als zu langsam herausgestellt hat und auch nicht so einfach mit [JPEG XL](https://github.com/libjxl/libjxl) verheiraten war, wie [`vips`](https://github.com/libvips/libvips)), genutzt haben, gab es schon einen Kandidaten für die notwendigen Anpassungen. Zusätzlich hat eine Python Implementierung den Vorteil das [Pillow](https://github.com/python-pillow/Pillow) genutzt werden kann: Die [MPO](https://de.wikipedia.org/wiki/Multi_Picture_Object) (einem JPEG Derivat, das strukturell mit UltraHDR verwand ist) Implementierung ist schon für [VintageReality](https://vintagereality.projektemacher.org/) zum Einsatz gekommen.

Es fehlte "nur" die Unterstützung für das Schreiben von [XMP](https://de.wikipedia.org/wiki/Extensible_Metadata_Platform) Metadaten. Für normale JPEG Dateien, war es noch recht [einfach](https://github.com/python-pillow/Pillow/discussions/8269#discussioncomment-10201110)...
Am Ende habe ich einfach ein Backend auf Basis von [`libultrahdr`](/post/ultrahdr/) geschrieben.

Unten das Ergebnis.

# Nächste Schritte

Derzeit gibt es für IIIF noch keine standardisierte Möglichkeit auf UltraHDR Inhalte hinzuweisen. Prinzipiell gibt es Felder, die für diese Aufgabe genutzt werden können, aber eine Aufnahme in den Standart ist wünschenswert, damit Viewer Implementierungen darauf hinweisen können, wenn der Monitor die Anzeige nicht unterstützen.

# Ergebnis

{{< hdr-canvas-check >}}

Wenn der Test fehlschlägt, sind die Farben nicht so leuchtend.

**Das weltweit erste HDR IIIF Bild ist eine 70er Jahre Tapete!**

{{< iiif/iiif src="front.hdr/info.json" share=false hdr=true >}}

# Update 28.8.2024

Es gibt nun ein entsprechendes [GitHub Issue](https://github.com/IIIF/api/issues/2312) um zu schauen ob es Interesse an der Erstellung einer Spezifikation gibt.
