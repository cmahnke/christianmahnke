---
date: 2025-12-28T18:22:44+02:00
title: "Historical stereograms on modern hardware"
description: "The Apple Spatial Image format"
keywords: "Stereoskopie, Anaglyphen"
cite: true
tags:
  - AI
  - 3D
  - DigitalImages
  - OpenCV
  - Stereoscopy
wikidata:
  - https://www.wikidata.org/wiki/Q35158
  - https://www.wikidata.org/wiki/Q484031
  - https://www.wikidata.org/wiki/Q24907733
  - https://www.wikidata.org/wiki/Q117715451
---

I have a new phone...
<!--more-->

...with a new, interesting feature that combines several of my favourite things: digital image formats and stereoscopy/3D.

Apple has expanded the HEIC image format slightly for mixed reality glasses. Instead of one image, two slightly offset images are stored in a container together with some metadata. In the image gallery, for example, this combination causes an additional icon to appear that can be used to activate the spatial view. The latest iPhones can also take such pictures.

Before we get into the boring technical details, here is an example with a historical stereogram from the VintageReality website (https://vintagereality.projektemacher.org/post/calcutta/). The button for the spatial view can be seen at the top right.

{{< video src="img/calcutta" >}}

## Implementation

The result was achieved through the following steps:

### HEIC images

First, the images are extracted from the scans of the cards. The [model from the last post](/post/vintagereality-ai/) is used for this purpose. They are then superimposed on top of each other with almost pixel-perfect accuracy using OpenCV, the resulting edges are removed where possible, and the brightness is adjusted.

The two half-images are then embedded in an HEIC container using the Python module [`pillow_heif`](https://github.com/bigcat88/pillow_heif).

### XMP metadata

The necessary metadata is encoded in XMP, comparable to old (2024) UltraHDR implementations.

The elements are located in the namespace `http://ns.apple.com/image/1.0/` (preferred prefix `apple`).

| Element | Type | Description |
| :--- | :--- | :--- |
| `HorizontalFOV` | Real | Horizontal field of view in degrees. |
| `Baseline` | Real | Stereo baseline (eye distance) in millimetres. |
| `HorizontalDisparityAdjustment` | Real | Factor for adjusting the horizontal disparity (usually a percentage, e.g. 0.02). |
| `CameraModelType` | String | The projection model type. Value used: `SimplifiedPinhole`. |
| `CameraIntrinsics` | String | Intrinsic camera parameters as a space-separated string: `f_pix 0 ppx 0 f_pix ppy 0 0 1`. |
| `CameraExtrinsicsRotation` | String | Rotation matrix as a space-separated string (row-oriented). Value: `1 0 0 0 1 0 0 0 1` (identity). |
| `CameraExtrinsicsPosition` | String | Position vector in metres as a space-separated string `x y z`. Value: `0 0 0`. |
| `StereoGroupIndex` | Integer | Index for identifying the stereo group. Value: `1`. |
{.even-table}

Many of these values are estimated, as exact values for the old cameras used cannot be determined:

| Parameter | Value |
| :--- | :--- |
| Horizontal field of view | 45° |
| Interpupillary distance | 65 mm |
| Disparity | 2% |

Theoretically, the disparity could also be determined using OpenCV via alignment, but small deviations are insignificant. The remaining values can be calculated from the estimated values and the size of the input images:

\[
\begin{aligned}
f\_pix &= \frac{width \cdot 0.5}{\tan(hfov_{rad} \cdot 0.5)} \\
ppx &= \frac{width}{2.0} \\
ppy &= \frac{height}{2.0} \\
\end{aligned}
\]

#### Further information from Apple Developer

* [Creating spatial photos and videos with spatial metadata](https://developer.apple.com/documentation/ImageIO/Creating-spatial-photos-and-videos-with-spatial-metadata)
* [Writing spatial photos](https://developer.apple.com/documentation/imageio/writing-spatial-photos)

### Injecting metadata

Finally, the metadata must be injected into the image file. After some configuration (for the namespace and elements), this can be done with Phil Harvey's [`exiftool`](https://exiftool.org/).

## Results

In principle, the process works, with the results for indoor shots being significantly better than for outdoor shots. For outdoor shots, however, it can be helpful to compress the spatial staggering of the image planes slightly.

To try it out, these files can be saved on the iPhone in the "Photos" app.

* <a href="./img/calcutta.heic" title="Image file" class="download-icon">Image file</a>,  **Post**: [Empfangssaal des Maharajah von Tangore in Calcutta, Indien](https://vintagereality.projektemacher.org/post/calcutta/)
* <a href="./img/neues-museum.heic" title="Image file" class="download-icon">Image file</a>, **Post**: [Neues Museum - Gruppe des farnesischen Stiers](https://vintagereality.projektemacher.org/post/neues-museum/)
* <a href="./img/damascus.heic" title="Image file" class="download-icon">Image file</a>,  **Post**: [Salon in the harem of a Mohammedan Pasha, Damascus](https://vintagereality.projektemacher.org/post/damascus/)
