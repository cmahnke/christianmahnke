---
title: "Bewerbung Digitalkoordinator"
metaPage: true
displayinlist: false
theme: orange
archive: false
news: false
scss:
  - scss/orange.scss
  - scss/3d/3d-model.scss
js:
  - https://aframe.io/releases/1.5.0/aframe.min.js
  - https://unpkg.com/aframe-orbit-controls@1.3.2/dist/aframe-orbit-controls.min.js

---

{{< browser-banner browser="edge,firefox,safari" parent=".content-container" >}}

This page is a prototype and best displayed in [Google Chrome](https://www.google.com/chrome/).
{{< /browser-banner >}}

# Virtual exhibition on orange ceramics

Orange glazes for ceramics are comparatively rare and are also subject to certain fashions. The best known are the phases of the 1920s / 1930s (also known simply as Art Deco) and the 1960s / 1970s (usually summarised as "Fat Lava").  

In the past, [uranium-containing glazes](https://de.wikipedia.org/wiki/Uranglasur) were often used to produce these colours.

Presumably also favoured by the fact that such objects contain uranium, there is a certain interest from collectors. Some also have a presence on the Internet:

## External pages

* [Frank Pintschka: Uranium glazes and more...](http://frank-pintschka.de/3.html)

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

# Exponate
