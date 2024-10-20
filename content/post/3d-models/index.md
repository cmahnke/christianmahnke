---
date: 2024-02-24T10:16:44+02:00
title: "3D Modelle im Browser"
keywords: Fat Lava Vase, GLTF, GLB, A-Frame
description: "3D Darstellung einer 60er Jahre Vase im Browser"
preview:
  image: preview.png
  hide: true
scss:
  - scss/3d/3d-model.scss
js:
  - https://aframe.io/releases/1.5.0/aframe.min.js
  - https://unpkg.com/aframe-orbit-controls@1.3.2/dist/aframe-orbit-controls.min.js
tags:
  - Light
  - Licht2024
  - 3D
  - Three.js
  - Blender
  - Photogrammetry
---

Vielleicht wird mal eine virtuelle Ausstellung über orangene Keramik draus...

<!--more-->

In meinem Büro befindet sich eine kleine Sammlung von orangener Keramik, der 60er- / 70er-Jahre (meist als "Fat Lava" zusammengefasst).  

## Digitalisierung
Das Verfahren nennt sich [Photogrammetrie](https://de.wikipedia.org/wiki/Photogrammetrie), dabei wird ein 3D Modell (und die Textur) aus Einzelbildern aus verschiedenen Blickrichtungen rekonstruiert. Für jedes der gezeigten Exponate waren trotz der relative einfachen Geometrie und geringen (gezeigten) räumlichen Auflösung zwischen 50 und 70 Bilder notwendig.

<details>
<summary>Datenbearbeitung und -konversion</summary>

* Die erstellten Modelle wurden in [Blender](https://www.blender.org/) nachbearbeitet.
* Die Konvertierung in das GLTF/GLB-Format wurde mit [`obj2gltf`](https://github.com/CesiumGS/obj2gltf) gemacht.
* Die Metadaten mit [`gltf-transform`](https://gltf-transform.dev/) hinzugefügt.
</details>

## Präsentation

Die gezeigten Exponate lassen sich rotieren und Vergrößern, ebenfalls ist eine Vollbildanzeige möglich. Die Darstellung mittels VR-Brille konnte mangels entsprechender Ausstattung nicht getestet werden. Die Realisierung erfolgte prototypisch mit Hilfe der JavaScript Bibliothek [A-Frame](https://aframe.io/), daher sind kleinere Probleme wie verzehrte Perspektiven möglich.
Die Darstellung wurde mit Chrome und Safari getestet, in Firefox und Edge können die Objekte leicht gestaucht sein.

## Ergebnis

{{< aframe-3d-model src="/applications/digitalkoordinator/vase1/model/LavaVase.glb" initialPosition="0 0.5 6" minDistance=5  >}}
