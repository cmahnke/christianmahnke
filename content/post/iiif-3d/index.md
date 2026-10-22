---
date: 2026-10-16T15:00:00+02:00
title: "IIIF 3D"
keywords: IIIF, Presentation API 4, GLTF, GLB, 3D
tags:
  - IIIF
  - 3D
  - Photogrammetry
  - Digitisation
params:
  wikidata:
    - https://www.wikidata.org/wiki/Q22682088
    - https://www.wikidata.org/wiki/Q28135989
    - https://www.wikidata.org/wiki/Q190149
    - https://www.wikidata.org/wiki/Q3525922
---

In diesem Blog gibt es seit ungefähr 2,5 Jahren auch 3D-Modelle. Nun können sie auch über IIIF (V4) in Manifeste betrachtet werden.
<!--more-->

## IIIF Presentation V4?

[IIIF (Presentation) V4](https://iiif.io/api/presentation/4.0/) ist lange gereift und befindet sich seit April 2026 als [Release Candidate im Abstimmungsverfahren](https://github.com/IIIF/trc/issues/140). Eine wesentliche Neuerung ist die Unterstützung von 3D-Daten. Der neue Container dafür ist [`Scene`](https://iiif.io/api/presentation/4.0/#scene), dazu (oder besser: darin) kommt `Model` zum Einsatz. Neben Modellen können auch Lichter und Kameras in einer Szene platziert werden. Modelle können wie im Web üblich als [glTF](https://www.khronos.org/gltf/) (bzw. GLB als Binärformat) genutzt werden. Weitere Informationen und Beispiele finden sich bei der [IIIF 3D Technical Specification Group](https://iiif.github.io/3d/), darunter [Beispiel-Manifeste](https://iiif.github.io/3d/manifests/).

## Die Manifeste

Die 3D-Modelle dieses Blogs (für [3D Modelle im Browser](/post/3d-models/) und [UV-Photogrammetrie](/post/uv-photogrammetry/)) sind jetzt auch als IIIF-Manifeste verfügbar.

Alle Seiten mit 3D-Inhalten, ihre Manifeste und der jeweilige Link zum [Kasane](https://kasane.ldas.jp)-Viewer:

| Seite | Manifest | Viewer |
|-------|----------|--------|
| [3D Modelle im Browser](/post/3d-models/) | [manifest.json](/post/3d-models/manifest.json) | [Kasane](https://kasane.ldas.jp/viewer?iiif-content=https%3A%2F%2Fchristianmahnke.de%2Fpost%2F3d-models%2Fmanifest.json) |
| [UV-Photogrammetrie](/post/uv-photogrammetry/) | [manifest.json](/post/uv-photogrammetry/manifest.json) | [Kasane](https://kasane.ldas.jp/viewer?iiif-content=https%3A%2F%2Fchristianmahnke.de%2Fpost%2Fuv-photogrammetry%2Fmanifest.json) |

## Viewer

Ein Manifest ist nur die halbe Miete, gebraucht wird auch ein Viewer, der die `Scene`-Klasse darstellen kann. [Kasane](https://kasane.ldas.jp) (früher "IIIF 3D Viewer", Universität Tokio) ist ein [Open-Source-Viewer](https://github.com/nakamura196/iiif-kasane) (MIT), der 3D-Modelle, Bilder, Audio und Video aus IIIF-Manifesten darstellt und mit Annotationen erweitern kann. Das Projekt ist momentan noch nicht auf [npm](https://github.com/nakamura196/iiif-kasane/issues/263) veröffentlicht, der Aufruf eines Manifests erfolgt aber bereits per Deep-Link:

```
https://kasane.ldas.jp/viewer?iiif-content=<URL-des-Manifests>
```
