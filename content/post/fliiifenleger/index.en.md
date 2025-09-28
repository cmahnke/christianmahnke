---
date: 2025-07-27T18:22:44+02:00
title: "Fliiifenleger - an IIIF experimental platform"
keywords:
cite: true
tags:
- IIIF
- DigitalImages
- Java
---

{{< figure src="Fliiifenleger.svg" alt="Fliiifenleger Logo" class="center" >}}

It was time for an experimental IIIF Tiler...
<!--more-->

In the past, I have conducted several experiments with the IIIF Image API. Examples include:

* [JPEG XL](https://christianmahnke.de/en/post/jpeg-xl/),
* [IIIF Proxy](https://christianmahnke.de/en/post/iiif-proxy/),
* [HDR IIIF](https://christianmahnke.de/en/post/hdr-iiif/)


To do this, I expanded on some existing implementations. However, since this either became quite slow or not very intuitive, I decided to build my own "platform":

# Fliiifenleger


`fliiifenleger` is a Java-based command line tool for generating and validating static IIIF (International Image Interoperability Framework) images.

It processes local image files to create IIIF-compliant tile structures and the associated `info.json` file.

The tool offers commands such as `generate` for creating tiles, `validate` for checking IIIF endpoints, and `info` for displaying system information.

A special feature is the ability to chain image processors, for example to apply filters before tiling. In addition, serialisation (i.e. saving the created tiles) is extensible and interchangeable.

*The name is a play on the visual similarity between the small [long S](https://en.wikipedia.org/wiki/Long_s) and F in Fraktur fonts.*

**The code is available on [GitHub](https://github.com/cmahnke/fliiifenleger).**
