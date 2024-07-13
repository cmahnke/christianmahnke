---
date: 2024-05-23T11:22:44+02:00
title: "LibUltraHDR"
tags:
  - light
  - Licht2024
  - digitalImages
  - HDR
---

After [research](/en/post/hdr-awesome-list/), it was necessary to explore some possible workflows and to create tools for a project in preparation. Based on [Greg Benz](https://gregbenzphotography.com/hdr/)'s preliminary work on HDR support, LibUltraHDR was the most sensible candidate for further experimentation.
<!--more-->

# LibUltraHDR

[LibUltraHDR](https://github.com/google/libultrahdr) is primarily a library for UltraHDR content. The format itself is comparable to [MPO](https://en.wikipedia.org/wiki/JPEG#JPEG_Multi-Picture_Format). There is a primary (SDR) image, which is also used as a fallback for software without UltraHDR support, and a secondary image in the metadata, the so-called gain map. This maps the luminance gain to be applied to the SDR. More information on how gain maps work can be found at [Adobe](https://helpx.adobe.com/camera-raw/using/gain-map.html).

Technical documentation is available at [Android Developers](https://developer.android.com/media/platform/hdr-image-format).

## Status
Greg Benz and others are currently working on promoting support for the format among relevant open source projects:
- [LibVips #3799](https://github.com/libvips/libvips/issues/3799)
- [ImageMagick #6377](https://github.com/ImageMagick/ImageMagick/issues/6377)
- [**Tev** #226](https://github.com/Tom94/tev/issues/226)
- [HDRImageViewer #66](https://github.com/13thsymphony/HDRImageViewer/issues/66)
- [`ffmpeg` #10974](https://trac.ffmpeg.org/ticket/10974)
- [Pillow #8036](https://github.com/python-pillow/Pillow/issues/8036)
- [CanIUse #6759](https://github.com/Fyrd/caniuse/issues/6759)
- [`libjxl` #2685](https://github.com/libjxl/libjxl/issues/2685)
- [Memories #1110](https://github.com/pulsejet/memories/issues/1110)

There are also some first websites with support:
* [Gainmap Creator](https://gainmap-creator.monogrid.com/)
* [Demo for conversion using `ffmpeg` and `libultrahdr`](https://github.com/albertz/playground/wiki/HDR-demo) by [Albert Zeyer](https://github.com/albertz)
* [`libultrahdr` and Python](https://github.com/albertz/playground/blob/master/ultrahdr.py), also by Albert Zeyer

## Manual conversion with `ffmpeg`

Since the release of version 0.8 of `libultrahdr` the command line options have changed, here is the current (May 2024) version. It is important that:
* The dimensions of the input image are known (X, Y)
* The dimensions are divisible by two (even)

In the first step, a YUV representation of the input image must be generated, this is used as a gain map, i.e. as a definition of the gain.

```
ffmpeg -i input.jpg -filter:v format=p010 output.yuv
```

In the next step, the gain map created can then be used to generate the desired image:
```
ultrahdr_app -m 0 -p output.yuv -i input.jpg -w X -h Y -a 0
```

In the coming months it can be expected that the somewhat esoteric YUV format will either be easier to generate or can be dispensed with altogether.

## Docker Image

There is now also a Docker image that provides the latest version of `libultrahdr` together with ImageMagick with UltraHDR support.

```
docker pull ghcr.io/cmahnke/hdr-tools:latest
```

# Next steps

Currently, HDR support for HDR images and content is limited to Chrome and its derivative browsers, which have a 75% market share. The [HDR support of Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=hdr), or rather the way to get there, is rather embarrassing - not even HDR video formats are fully supported.

For Chrome-based browsers, however, it should also be possible to add HDR content to HTML canvas elements.

# Update 6.7.24

Two examples from my recent vacation:

{{< hdr-check >}}

{{< gallery >}}
[
  {"src": "img/IMG_5255.hdr.jpeg", "alt": "Sunset over Hörnum"},
  {"src": "img/IMG_5256.hdr.jpeg", "alt": "Sunset on Föhr"}
]
{{</ gallery >}}

HDR will be activated in the full screen view.
