---
date: 2025-11-16T20:22:44+02:00
title: "hdr-canvas 0.1.0 published"
keywords: NPM, TypeScript
cite: true
aliases:
  - /en/post/hdr-canvas-0.1.0
tags:
  - JavaScript
  - HDR
wikidata:
  - https://www.wikidata.org/wiki/Q7067518
  - https://www.wikidata.org/wiki/Q2005
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q978185
  - https://www.wikidata.org/wiki/Q116963687
  - https://www.wikidata.org/wiki/Q28957081
  - https://www.wikidata.org/wiki/Q136933249
  - https://www.wikidata.org/wiki/Q3525922
  - https://www.wikidata.org/wiki/Q615940
  - https://www.wikidata.org/wiki/Q110650833
  - https://www.wikidata.org/wiki/Q5439690
  - https://www.wikidata.org/wiki/Q6368
  - https://www.wikidata.org/wiki/Q79534
lastmod: 2026-10-13T00:00:00+02:00
---

`hdr-canvas` has been updated...
<!--more-->

One result of my work with HDR content in the browser is an NPM module, which was also used to create the posts in this blog.
This article summarises the latest changes. It will be updated when new versions are released.

## Version 0.4.0

### Introduction

This release brings back a lightweight way to scale colors into the HDR range and finishes the `Uint16` cleanup: `Uint16Array` was the pre-137 Chromium experimental HDR path, it is intentionally not part of the WHATWG spec (`Uint8ClampedArray | Float16Array` only) nor the TypeScript DOM lib, so only `Float16` lands.

### Key Changes & New Features

- New `Float16Image` HDR gain scaling (replaces the removed `colorjs.io` based conversion with a dependency-free linear boost)
  - `applyGain(gain)` (in place) and `scaled(gain)` (on a copy), with uniform `number` or per-channel `[r, g, b]` gain. Alpha is preserved by default.
  - Values `>1` push into the HDR headroom and only become visible on a canvas with `toneMapping: { mode: "extended" }` (see `getHdrOptions()`), otherwise they clip to SDR white.
  - The demo image slider (`tests/site/assets/ts/image-slider.ts`) now uses `scaled()` instead of its hand-rolled `pixelCallback` (slider `50` is gain `1`, `100` is gain `2`).
  - New `Float16ImageGain` test suite.
- Breaking type cleanup
  - Removed `Uint16Array` from the exported `HDRImageDataArray` and `HDRImageData` types.
  - Deprecated `HDRImage.SDR_MULTIPLIER` (kept for compat, use `applyGain()` / `scaled()` instead) and corrected the `HDRImagePixelCallback` docs (`0-65535` ints to float `0-1` SDR / `>1` HDR headroom).
- Docs: README notes the package scope (`@projektemacher/hdr-canvas` on npm, `@cmahnke/hdr-canvas` on GitHub Packages).
- Experimental WASM acceleration for gain (AssemblyScript kernel, inlined as base64, disabled by default behind `setWasmEnabled(true)` with transparent JS fallback)
  - Measured on Node 24 over 12 M values: JS ~12 ms vs WASM ~51 ms (~3 ms copies) — engines with native `Float16Array` use hardware F16C conversion that the scalar kernel can't beat, so the flag stays off for now and exists as tested infrastructure (parity within 1 ulp) for future compute-heavy kernels.
- Citation metadata maintenance (`url`, `dateReleased`) and dependency updates (including `assemblyscript` as a devDependency).

## Version 0.3.1

### Introduction

Metadata-only release, no functional changes since 0.3.0.

### Key Changes & New Features

- Added `CITATION.cff` and `codemeta.json` (with a workflow keeping them in sync).
- Added a deploy guard to `.github/workflows/npm.yml`: publishing is skipped when the version already exists on the registry, so forced manual re-deployments no longer fail.
- Version bump 0.3.0 to 0.3.1.

## Version 0.3.0

### Introduction

This release moves the package into an org and separates WCG from HDR detection.

The package is now published as `@projektemacher/hdr-canvas` on npm (GitHub Packages publishes it as `@cmahnke/hdr-canvas` via a rewrite in `.github/workflows/npm.yml`):

```
npm i @projektemacher/hdr-canvas
```

Additionally `main` was fixed to `dist/hdr-canvas.js` and the `LICENCE` typo in the `files` list was corrected to `LICENSE`.

### Key Changes & New Features

- Detect WCG and HDR separately ([#23](https://github.com/cmahnke/hdr-canvas/issues/23), [#107](https://github.com/cmahnke/hdr-canvas/issues/107))
  - New checks: `checkWCG`, `checkWCGCanvas`, `checkDynamicRangeHigh`, `checkColorGamutP3` / `checkColorGamutRec2020` and `getWcgOptions()` (`display-p3`, for WCG-only browsers like Safari and Firefox on macOS).
  - New `getDisplayCapabilities()` and `onDisplayChange()` subscription (media query `change` events with polling fallback), so moving a window between screens re-evaluates the display.
  - Checks hardened against missing `window` / `document` / `screen`.
  - Demo site, README docs and import fixture updated, new `hdr-check` and `display-change` test suites added.
- More robust `HDRImage` base class
  - Removed unimplemented `fromImageData` / `fromImageDataArray` stubs.
  - `loadSDRImageData()` checks `response.ok` and catches failures instead of rejecting.
  - `getPixel()` / `setPixel()` throw a `RangeError` outside the image bounds.
  - Fixed `clone()` to actually deep-copy `data`.
- Safari handling extracted into `src/browser.ts` (`isSafari()`), reused in `src/hdr-canvas.ts` and (duplicated, kept in sync) in `three/HDRWebGPUBackend.js`.
- `defaultGetContextHDR()` is now idempotent and only patches `"2d"` contexts, `resetGetContext()` fully restores the original `getContext`.
- New `tests/version-check.ts` global setup enforcing `engines.node` for the test run.
- Dependency updates, including `vitest` 4 to 5.

## Version 0.2.0

### Introduction

The following things have been removed:

- the support for Chrom(e|ium) < 140
- `Uint16Image`
- Utils for browser version check.
- bundled UMD and IIFE builds.
- `colorjs.io` isn't a direct dependency anymore

Support for Safari started (current target is Safari Technology Preview R232 and later): This requires the feature flag "Canvas Color Types and ImageData Pixel Formats". But this currently doesn't support the `rec2100-hlg` color space.

### Key Changes & New Features

- Check function for Float16Array
- `Float16Array` support is no handled by [`@petamoriken/float16`](https://www.npmjs.com/package/@petamoriken/float16)

### Removal of [`colorjs.io`](https://colorjs.io/)

Even though `colorjs.io` is quite helpful for color space conversions, it's increases the size of a package considerably. And since there are other packages to handle the `Float16`, the package has been removed. If you need your own conversions, add it to your project:

```
npm install colorjs.io
```

## Version 0.1.1 - 0.1.2

These updates were necessary to fix the following blog posts:
* [UV photogrammetry](https://christianmahnke.de/en/post/uv-photogrammetry/)
* [Contrast enhancement for UV images using HDR rendering](https://christianmahnke.de/en/post/hdr-image-analysis/)

### 0.1.1

#### Changes to the initialisation of a `WebGPU` context for `canvas`

The changes to the initialisation of a `canvas` for a renderer are described in the [explanation](https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md).

The most important change is the renaming of ‘colourMetadata’ to:

```
toneMapping: { mode: ‘extended’ }
```

### 0.1.2

The colour scaling of `Float16Image` was incorrect; the scaling only worked for 0% - 1%.

## Version 0.1.0

A year has passed since the first versions and the browser API was rather experimental at that time. A lot has changed since then - one of the examples had even stopped working in the meantime: The most important change concerns the change from `Uint16` to `Float16` as 16 bit pixel data type for HDR.

Since browsers are developing rapidly and the use of older browsers is not recommended for security reasons (even if some people see it differently), **no downward compatibility** is to be expected.

In addition to the necessary adjustments, the new version also offers improvements in the area of documentation and examples.

The code can be found on [GitHub](https://github.com/cmahnke/hdr-canvas) and [NPM](https://www.npmjs.com/package/hdr-canvas).

### The release notes

#### Introduction

Since the last release many areas of handling HDR content in the browser have evolved.
Most notably is certainly the introduction of the `Float16Array` in the `ImageData` construtor:

- The [WhatWG spec](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#imagedataarray), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData#syntax) and [BCD](https://github.com/mdn/browser-compat-data/issues/27547)) have been updated accordingly. You can test your own browser using `new ImageData(new Float16Array(4), 1, 1, {pixelFormat:"rgba-float16"})`.
  - Still open in [Firefox](https://bugzil.la/1958830)
  - Hidden behind flag in [Safari](https://webkit.org/b/291196)
  - Chromium has implemented it starting with [137](https://source.chromium.org/chromium/chromium/src/+/refs/tags/137.0.7104.0:third_party/blink/renderer/core/html/canvas/image_data.idl): \*\*The `ImageData` constructor only acceppts `Float16Array` instead of `Uint16Array`. This makes older versions of this modue obsolute, since they targeted the chromium specific solution.
  - If Safari enables it by default it will be also in the [Typescript DOM types](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)

As [@reitowo](https://github.com/reitowo) pointed out, there has been a change to the `getContext("2d")` method. The key `pixelFormat` has been replaced by `colorType`.

In parallel there have been changes to the UltraHDR image format, especially the encoding of gain map metadata. While this used to be don in XMP it's now done according to ISO 21496-1. This has been adopted by Google and Apple in newer OS versions like Android 15 and iOS 18 to avoid cross-platform fragmentation. The [UltraHDR Library](https://github.com/google/libultrahdr) has already changed to using the [ISO format as default](https://github.com/google/libultrahdr/blob/main/docs/building.md).

Currently the ThreeJS UHDR loader doesn't know how to handle this change, see [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).

#### Key Changes & New Features

- Better support for official Web-APIs
  - Use `Float16Array` instead of `Uint16Array`
  - Use the correct option for initializing 2D canvas context

##### Improved Documentation

The documentation have been greatly improved, there is now also a [site](https://cmahnke.github.io/hdr-canvas/) including the examples and API docs.

##### Examples

The examples from this blog are now part of this repository:

- [`tests/site/assets/ts/hdr-three.js.ts`](tests/site/assets/ts/hdr-three.js.ts) - Three JS with HDR texture
- [`tests/site/assets/ts/image-slider.ts`](tests/site/assets/ts/image-slider.ts) - Generated HDR content
- [`tests/site/assets/ts/main.ts`](tests/site/assets/ts/main.ts) - feature detection

These example are also avalable on the new [documentation site](https://cmahnke.github.io/hdr-canvas/)

#### Advocacy

Since the changes by the WhatWG weren't picked up already there had to be some Issues in the relevant repos to be raised.

- [mdn/content#40639](https://github.com/mdn/content/issues/40639)
- [mdn/browser-compat-data#27547](https://github.com/mdn/browser-compat-data/issues/27547)
- [microsoft/TypeScript-DOM-lib-generator#2107](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)
- [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).

# Update 13.10.2026

As previously [announced](/en/post/npm-org/), `hdr-canvas` has been renamed to [`@projektemacher/hdr-canvas`](https://www.npmjs.com/@projektemacher/hdr-canvas).
