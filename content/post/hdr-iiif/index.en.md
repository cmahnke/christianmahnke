---
date: 2024-08-02T11:33:44+02:00
title: "HDR IIIF"
draft: true
tags:
  - Light
  - Licht2024
  - DigitalImages
  - HDR
  - IIIF
iiifContext: http://iiif.io/api/image/2/context.json
draft: true
resources:
- src: "front.hdr.jxl"
  name: front
  params:
    iiif: front.hdr/info.json
---

At [Zeitzeug](http://www.zeitzeug.de/) the owner's wallpaper collection is being sold and I have secured a particularly bright example...
<!--more-->

And since I have a blog, [Vorsatzpapier](https://vorsatzpapier.projektemacher.org/), which also presents old wallpapers, I digitised it. Unfortunately, the luminous character doesn't really come out [Vorsatzpapier](https://vorsatzpapier.projektemacher.org/post/tapete-20/).

This gave me the idea of trying to provide an UltraHDR image in the form of IIIF. The main problem was to split the image into tiles, as common tools only use the SDR representation of the image.

# Image Tiler for UltraHDR

Since my blogs initially used `iiif_static.py` from the Python module [`iiif`](https://github.com/zimeon/iiif) (which turned out to be too slow and was also not as easy to marry with [JPEG XL](https://github.com/libjxl/libjxl) as [`vips`](https://github.com/libvips/libvips)), there was already a candidate for the necessary adaptations. In addition, a Python implementation has the advantage that [Pillow](https://github.com/python-pillow/Pillow) can be used: The [MPO](https://de.wikipedia.org/wiki/Multi_Picture_Object) (a JPEG derivative that is structurally related to UltraHDR) implementation has already been used for [VintageReality](https://vintagereality.projektemacher.org/).

It ‘only’ lacked support for writing [XMP](https://de.wikipedia.org/wiki/Extensible_Metadata_Platform) metadata. For normal JPEG files, it was still quite [simple](https://github.com/python-pillow/Pillow/discussions/8269#discussioncomment-10201110)...
In the end, I simply wrote a backend based on [`libultrahdr`](/post/ultrahdr/).

Below is the result.

# Next steps

There is currently no standardised way for IIIF to indicate UltraHDR content. In principle, there are fields that can be used for this task, but inclusion in the standard is desirable so that viewer implementations can point this out if the monitor does not support the display.

https://iiif.io/api/image/3.0/#57-extra-functionality