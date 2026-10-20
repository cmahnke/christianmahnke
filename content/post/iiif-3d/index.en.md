---
date: 2026-10-16T15:00:00+02:00
title: "IIIF 3D"
keywords: IIIF, Presentation API 4, GLTF, GLB, 3D
tags:
  - IIIF
  - 3D
  - Photogrammetry
  - Digitisation
wikidata:
  - https://www.wikidata.org/wiki/Q22682088
  - https://www.wikidata.org/wiki/Q28135989
  - https://www.wikidata.org/wiki/Q190149
  - https://www.wikidata.org/wiki/Q3525922
---

This blog has also featured 3D models for about 2.5 years. They can now also be viewed via IIIF (V4) in manifests.
<!--more-->

## IIIF Presentation V4?

[IIIF (Presentation) V4](https://iiif.io/api/presentation/4.0/) has been a long time in the making and has been undergoing the [release candidate review process](https://github.com/IIIF/trc/issues/140) since April 2026. A key new feature is support for 3D data. The new container for this is [`Scene`](https://iiif.io/api/presentation/4.0/#scene), alongside which (or rather, within which) `Model` is used. In addition to models, lights and cameras can also be placed within a scene. Models can be used in the [glTF](https://www.khronos.org/gltf/) (or GLB as a binary format). Further information and examples can be found at the [IIIF 3D Technical Specification Group](https://iiif.github.io/3d/), including [sample manifests](https://iiif.github.io/3d/manifests/).

## The manifests

The 3D models on this blog (for [3D models in the browser](/post/3d-models/) and [UV photogrammetry](/post/uv-photogrammetry/)) are now also available as IIIF manifests.

All pages with 3D content, their manifests and the respective link to the [Kasane](https://kasane.ldas.jp) viewer:

| Page | Manifest | Viewer |
|-------|----------|--------|
| [3D models in the browser](/post/3d-models/) | [manifest.json](/post/3d-models/manifest.json) | [Kasane](https://kasane.ldas.jp/viewer?iiif-content=https%3A%2F%2Fchristianmahnke.de%2Fpost%2F3d-models%2Fmanifest.json) |
| [UV photogrammetry](/post/uv-photogrammetry/) | [manifest.json](/post/uv-photogrammetry/manifest.json) | [Kasane](https://kasane.ldas.jp/viewer?iiif-content=https%3A%2F%2Fchristianmahnke.de%2Fpost%2Fuv-photogrammetry%2Fmanifest.json) |

## Viewer

A manifest is only half the battle; you also need a viewer that can display the `Scene` class. [Kasane](https://kasane.ldas.jp) (formerly “IIIF 3D Viewer”, University of Tokyo) is an [open-source viewer](https://github.com/nakamura196/iiif-kasane) (MIT) that displays 3D models, images, audio and video from IIIF manifests and can enhance them with annotations. The project has not yet been published on [npm](https://github.com/nakamura196/iiif-kasane/issues/263), but manifests can already be accessed via deep links:

```
https://kasane.ldas.jp/viewer?iiif-content=<URL of the manifest>
```
