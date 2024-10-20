---
date: 2024-09-05T11:33:44+02:00
title: "Ultraviolet Photogrammetry"
keywords: photogrammetry, UV, UV photogrammetry, ultraviolet, ultraviolet photogrammetry, uranium glass, 3D, Three.js
description: "3D model of a uranium glass object exposed to UV light"
preview:
  image: preview.png
  hide: true
class: uranium
pagetheme: #5107b7
tags:
  - Light
  - Licht2024
  - DigitalImages
  - HDR
  - 3D
  - Three.js
  - Photogrammetry
---

**This article presents the world's first HDR model of UV photogrammetry in a browser.**
<!--more-->

# Uranium glass

Since I have been buying [uranium glass](https://en.wikipedia.org/wiki/Uranium_glass) from time to time for years, when I can get it cheap, I already have a small collection. The really fascinating thing is the irradiation with UV light: then the glass is stimulated to glow. The effect also occurs with the UV component in sunlight, but is then much weaker. However, it is usually sufficient for the trained eye at the flea market.

As uranium glass is a popular collecting area, here is some more information and collections (mostly in German):
* [Uranium glass | From collectors for collectors](https://www.uranglas.ch/)
* [Hands-on radioactivity](https://www.radioaktivitaet-zum-anfassen.com/uranglas-mehr/photogalerie-urangl%C3%A4ser/)
* [J. Grzesina: Radiantly beautiful things](https://www.grzesina.de/radioakt/dinge.htm)
* And of course you can also find items on eBay etc...

As one of my technical interests is to improve the digital mediation of artefacts, here is an example of such an object under UV radiation. The object was captured using photogrammetry, digitally post-processed slightly and the texture was shifted in the colour space so that it can be displayed by an HDR-capable browser. Basically, the display works in the same way as with the [vase from February](/en/post/3d-model), only the recording method and the rendering of the texture differ. However, the latter (currently) requires a Chrome-based browser.

# Digitisation and post-processing
The creation and post-processing followed [the tried and tested procedure](/en/post/3d-models/), but considerably more post-processing was necessary, as significantly more shadows were cast when the picture was taken under UV light. Violet reflections from the UV lamp were also removed.

# Presentation

The implementation was easier than expected, basically only two steps are required. A customised version of [Three.js](https://threejs.org/) was used for the example.
* Create a GLTF model with UltraHDR texture, for converting the texture see [LibUltraHDR](/en/post/ultrahdr/). The customised texture must be packaged with the model in the next step, using [`obj2gltf`](https://github.com/CesiumGS/obj2gltf):

```
obj2gltf -i static/model/3DModel.obj -o static/model/uranium.glb
```

* A customised [Three.js Renderer](https://github.com/mrdoob/three.js/blob/master/examples/jsm/renderers/webgpu/WebGPURenderer.js), in this case a variant of the WebGPURenderer. This is required to control and influence the initialisation of the canvas element. This is done in the [`WebGPUBackend`](https://github.com/mrdoob/three.js/blob/master/examples/jsm/renderers/webgpu/WebGPUBackend.js). The following additional parameters are required for initialisation, more information [here](https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md#example-use):

```
colourSpace: "rec2100-hlg",
colourMetadata: { mode: "extended" }
```

In addition, the UltraHDR texture should be displayed without additional lighting, as otherwise the lighting will lead to conversions of the texture's colour.

# Example

{{< hdr-canvas-check >}}

If the HDR check fails, the colours are not displayed in their full luminance. **Even if the display of HDR images works, the HDR support for the `canvas` element needs the browser flag `enable-experimental-web-platform-features` to be enabled. For example, open "chrome://flags#enable-experimental-web-platform-features" in Chrome to activate it.**

{{< hdr-model model="model/uranium.glb" >}}

# Update for Three.js R167

After the update to Three.js R167, a further adjustment of the model is necessary. As the model must not be illuminated so that the texture cannot be "coloured" by shading, the material type must be changed to ‘MeshBasicMaterial’.
