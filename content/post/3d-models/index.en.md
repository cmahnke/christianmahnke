---
date: 2024-02-24T10:16:44+02:00
title: "3D Models in the browser"
scss:
  - scss/3d/3d-model.scss
js:
  - https://aframe.io/releases/1.5.0/aframe.min.js
  - https://unpkg.com/aframe-orbit-controls@1.3.2/dist/aframe-orbit-controls.min.js
tags:
  - light
  - Licht2024
  - 3D
---

Maybe it will become a virtual exhibition about orange ceramics...

<!--more-->

In my office there is a small collection of orange ceramics from the 60s / 70s (mostly summarised as ‘Fat Lava’).  

## Digitisation

The process is called [photogrammetry](https://de.wikipedia.org/wiki/Photogrammetrie), whereby a 3D model (and the texture) is reconstructed from individual images from different viewing directions. Despite the relatively simple geometry and low (shown) spatial resolution, between 50 and 70 images were required for each of the exhibits shown.

<details>
<summary>Data editing and conversion</summary>

* The created models were post-processed in [Blender](https://www.blender.org/).
* The conversion to GLTF/GLB format was done with [`obj2gltf`](https://github.com/CesiumGS/obj2gltf).
* The metadata was added with [`gltf-transform`](https://gltf-transform.dev/).
</details>

## Presentation

The exhibits shown can be rotated and enlarged, and a full-screen display is also possible. The presentation using VR glasses could not be tested due to a lack of appropriate equipment. The prototype was realised using the JavaScript library [A-Frame](https://aframe.io/), so minor problems such as blurred perspectives are possible.
The display was tested with Chrome and Safari, in Firefox and Edge the objects may be slightly distorted.

## Result

{{< aframe-3d-model src="/applications/digitalkoordinator/vase1/model/LavaVase.glb" initialPosition="0 0.5 6" minDistance=5  >}}
