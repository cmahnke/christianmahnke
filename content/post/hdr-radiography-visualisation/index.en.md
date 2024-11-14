---
date: 2024-11-13T12:00:44+02:00
title: "HDR images for the visualisation of X-ray examinations of old paintings"
keywords: Radiography, MET, Metropolitan Museum of Art, Paolo Veronese
tags:
  - DigitalImages
  - HDR
  - Art
---

Another use case for HDR images...

<!--more-->

...is the visualisation of X-ray diagnostic images of old paintings. This exciting process is used, for example, to visualise overpaintings, corrections or even underlying drawings ‘behind’ paintings in a non-destructive manner.

# Example

The [Metropolitan Museum of Art in New York](https://www.metmuseum.org/) makes some of its highlights available in high resolution and sometimes in different wavelengths under free licences.

The ‘Mars and Venus United by Love’ by [Paolo Veronese](https://en.wikipedia.org/wiki/Paolo_Veronese) from around 1578 used here as an example can be found at the museum under the accession number 10.189. As this is only a possible depiction, the work itself will not be discussed further. Further detailed information can be found at the [Metropolitan Museum itself](https://www.metmuseum.org/art/collection/search/437891).

This late Renaissance work shows some conspicuous deviations from visible light in the X-ray image. These include a change in the position of Venus' head and a hidden crack.

# Processing steps

The first step is to superimpose the original image and the X-ray image as accurately as possible so that the subsequent image operations produce as few artefacts as possible. It turned out that the X-ray image was minimally distorted.

In order to better display the differences, a greyscale derivative of the image in the visible light range must be "subtracted" from the X-ray image. The result can then be used to enhance the colours in the bright areas.

The "old" head and foot as well as the reworked shoulder are already clearly recognisable in the gain map itself.

The initial images and processing steps:

{{< gallery >}}
[
  {"src": "img/step0-visible.jpg", "alt": "Conventional image"},
  {"src": "img/step1-xray.jpg", "alt": "X-Ray image"},
  {"src": "img/step2-greyscale.jpg", "alt": "Grey scales of visible light"},
  {"src": "img/step3-gainmap.jpg", "alt": "Gainmap"}
]
{{</ gallery >}}

# Result

The previous result can certainly still be optimised in order to achieve better erasure when the X-ray image and greyscale image overlap.

Warning: The result is approx. 14 megabytes in size, HDR view after clicking on the preview image.

{{< gallery >}}
[
  {"src": "img/Mars and Venus United by Love.jpeg", "alt": "HDR image with highlighting"}
]
{{</ gallery >}}
