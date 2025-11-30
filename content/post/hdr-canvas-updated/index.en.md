---
date: 2025-11-16T20:22:44+02:00
title: "hdr-canvas 0.1.0 published"
keywords: NPM, TypeScript
cite: true
tags:
  - JavaScript
  - HDR
wikidata:
  - https://www.wikidata.org/wiki/Q7067518
  - https://www.wikidata.org/wiki/Q2005
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q978185
---

`hdr-canvas` has been updated...
<!--more-->

One result of my work with HDR content in the browser is an NPM module, which was also used to create the posts in this blog.
This article summarises the latest changes. It will be updated when new versions are released.

# Version 0.1.1 - 0.1.2

These updates were necessary to fix the following blog posts:
* [UV photogrammetry](https://christianmahnke.de/en/post/uv-photogrammetry/)
* [Contrast enhancement for UV images using HDR rendering](https://christianmahnke.de/en/post/hdr-image-analysis/)

## 0.1.1


The changes to the initialisation of a `canvas` for a renderer are described in the [explanation](https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md).

The most important change is the renaming of ‘colourMetadata’ to:

```
toneMapping: { mode: ‘extended’ }
```

## 0.1.2

The colour scaling of `Float16Image` was incorrect; the scaling only worked for 0% - 1%.

# Version 0.1.0

A year has passed since the first versions and the browser API was rather experimental at that time. A lot has changed since then - one of the examples had even stopped working in the meantime: The most important change concerns the change from `Uint16` to `Float16` as 16 bit pixel data type for HDR.

Since browsers are developing rapidly and the use of older browsers is not recommended for security reasons (even if some people see it differently), **no downward compatibility** is to be expected.

In addition to the necessary adjustments, the new version also offers improvements in the area of documentation and examples.

The code can be found on [GitHub](https://github.com/cmahnke/hdr-canvas) and [NPM](https://www.npmjs.com/package/hdr-canvas).

## The release notes

### Introduction

Since the last release many areas of handling HDR contet in the browser have evolved.
Most notably is certainly the introduction of the `Float16Array` in the `ImageData` construtor:

- The [WhatWG spec](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#imagedataarray), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData#syntax) and [BCD](https://github.com/mdn/browser-compat-data/issues/27547)) have been updated accordingly. You can test your own browser using `new ImageData(new Float16Array(4), 1, 1, {pixelFormat:"rgba-float16"})`.
  - Still open in [Firefox](https://bugzil.la/1958830)
  - Hidden behind flag in [Safari](https://webkit.org/b/291196)
  - Chromium has implemented it starting with [137](https://source.chromium.org/chromium/chromium/src/+/refs/tags/137.0.7104.0:third_party/blink/renderer/core/html/canvas/image_data.idl): \*\*The `ImageData` constructor only acceppts `Float16Array` instead of `Uint16Array`. This makes older versions of this modue obsolute, since they targeted the chromium specific solution.
  - If Safari enables it by default it will be also in the [Typescript DOM types](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)

As [@reitowo](https://github.com/reitowo) pointed out, there has been a change to the `getContext("2d")` method. The key `pixelFormat` has been replaced by `colorType`.

In parallel there have been changes to the UltraHDR image format, especially the encoding of gain map metadata. While this used to be don in XMP it's now done according to ISO 21496-1. This has been adopted by Google and Apple in newer OS versions like Android 15 and iOS 18 to avoid cross-platform fragmentation. The [UltraHDR Library](https://github.com/google/libultrahdr) has already changed to using the [ISO format as default](https://github.com/google/libultrahdr/blob/main/docs/building.md).

Currently the ThreeJS UHDR loader doesn't know how to handle this change, see [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).

### Key Changes & New Features

- Better support for official Web-APIs
  - Use `Float16Array` instead of `Uint16Array`
  - Use the correct option for initializing 2D canvas context

#### Improved Documentation

The documentation have been greatly improved, there is now also a [site](https://cmahnke.github.io/hdr-canvas/) including the examples and API docs.

#### Examples

The examples from this blog are now part of this repository:

- [`tests/site/assets/ts/hdr-three.js.ts`](tests/site/assets/ts/hdr-three.js.ts) - Three JS with HDR texture
- [`tests/site/assets/ts/image-slider.ts`](tests/site/assets/ts/image-slider.ts) - Generated HDR content
- [`tests/site/assets/ts/main.ts`](tests/site/assets/ts/main.ts) - feature detection

These example are also avalable on the new [documentation site](https://cmahnke.github.io/hdr-canvas/)

### Advocacy

Since the changes by the WhatWG weren't picked up already there had to be some Issues in the relevant repos to be raised.

- [mdn/content#40639](https://github.com/mdn/content/issues/40639)
- [mdn/browser-compat-data#27547](https://github.com/mdn/browser-compat-data/issues/27547)
- [microsoft/TypeScript-DOM-lib-generator#2107](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)
- [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).
