---
date: 2024-03-05T19:22:44+02:00
title: "VintageReality launched"
preview:
  image: screenshot.png
  hide: true
tags:
  - Projektemacher.org
  - Blog
  - Light
  - 3D
  - DigitalImages
  - OpenCV
---

The latest blog incubated at the [Projektemacher Labs](https://labs.projektemacher.org/) has been started.

<!--more-->

[VintageReality](https://vintagereality.projektemacher.org/) will present old stereoscopic images in various display modes in the future.

{{< zoom-link link="https://vintagereality.projektemacher.org/" title="VintageReality" >}}
    {{< figure src="screenshot.png" alt="Screenshot VintageReality" class="post-image" >}}
{{< /zoom-link >}}

# Presentation

To enable presentations with different glasses and techniques, additional formats and representations are available in addition to the IIIF presentation:

{{< figure src="img/image-tabs.jpg" alt="Derivatives" class="post-image" >}}

## Examples

{{< gallery >}}
[
  {"src": "img/front-anaglyph.jpg", "alt": "Anaglyph"},
  {"src": "img/front-depthmap.jpg", "alt": "Depth map"},
  {"src": "img/front.gif", "alt": "Wigglegram"}
]
{{</ gallery >}}

* [Anaglyph](https://en.wikipedia.org/wiki/Anaglyph_3D  )
* [Depth map](https://en.wikipedia.org/wiki/Depth_map)
* Wiggle image, eng. [Wigglegram](https://en.wikipedia.org/wiki/Wiggle_stereoscopy) (Both images as animated gif with quick change)

The site also offers additional derivatives:
* [MPO](https://en.wikipedia.org/wiki/JPEG#JPEG_Multi-Picture_Format).
* Full screen - for viewing with a [Cardboard VR](https://en.wikipedia.org/wiki/Google_Cardboard) (or similar) viewer.

# Implementation

The various derivatives were partly created with the help of [StereoscoPy](https://github.com/2sh/StereoscoPy), [OpenCV](https://opencv.org/) was used to calculate depth information.
