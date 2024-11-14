---
date: 2024-10-15T18:22:44+02:00
title: "Haptic Feedback"
description: 'A page from "Textil-Atlas: ein Lehrbuch und Nachschlagebuch für den Textileinzelhandel und die Gewebeverarbeitung: Textilwarenkunde und Gewebemuster" by Wilhelm Spitschka made tangible with IIIF'
keywords: Touch, Haptic Internet
tags:
- IIIF
- HapticFeedback
- DigitalImages
- JavaScript
outputs:
- html
- iiif-manifest
#iiifContext: http://iiif.io/api/presentation/2/context.json
resources:
- src: "page031.jxl"
  name: preview
  params:
    iiif: page031/info.json
    label: Tafel 31

---

Another contribution from the Projektemacher Labs...

<!--more-->

...finally completed thanks to Corona:


As this blog is also about transporting analogue content into the digital space in an innovative way, here is an attempt to make fabrics tangible...

Some time ago I bought a fabric sample book:
<p class="reference">
Textil-Lexikon: Ein Lehrbuch und Nachschlagebuch für den Textileinzelhandel und die Gewebeverarbeitung by Wilhelm Spitschka, Franckh, Stuttgart 1928. <a class="worldcat" href="http://www.worldcat.org/oclc/249121078">&nbsp;</a>
</p>

The patterns are not simply printed, but carefully cut out and glued in. The corresponding entry can be found at [Blaufußtölpel](https://xn--blaufusstlpel-qmb.de/post/textil-atlas-1928/). The aim of this article is to make them tangible in a new way.

# Preparation of the image data

The first step was to prepare the image data: The starting point for tactile feedback is the image files, as well as a manual marker for the sections (bounding box) with fabric.

"Height information" was obtained from these with some automated post-processing.However, there are only two gradations.These steps can be configured for each individual image section. After processing, the result was rasterised again to obtain a resolution of tangible points, using an edge length of 1 mm, as this corresponds approximately to the resolution of a human fingertip.

The Cordsamt (corduroy) serves as an example here:

{{< figure src="./page031-1-cut.png" caption="Extracted section" >}}

{{< figure src="./page031-1-filter_0_FIND_EDGES.png" caption="Edge detection" >}}

{{< figure src="./page031-1-filter_1_EDGE_ENHANCE.png" caption="Edge enhancement" >}}

{{< figure src="./page031-1-filter_2_SMOOTH_MORE.png" caption="Smoothen 1" >}}

{{< figure src="./page031-1-filter_3_SMOOTH_MORE.png" caption="Smoothen 2" >}}

{{< figure src="./page031-1-filter_4_GRAYSCALE.png" caption="Grayscaling" >}}

{{< figure src="./page031-1-filter_5_EQUALIZE.png" caption="Average" >}}

{{< figure src="./page031-1-filter_6_BINARIZE.png" caption="Binarisation" >}}

{{< figure src="./page031-1.png" caption="scaled down to a edge length of 1mm" class="img-center" >}}

<details>
  <summary>Example: The result of preprocessing as a JSON array</summary>
<pre>
{{< highlight json >}}
[
  [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,1,0,0,0,0,1,1,1,1,0,1,1,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,1,0,1,1,1,0,1,1],
  [0,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,0,1,1,0,1,1,1,0,1,1,1,1,0,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,0,0,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,1,1,1,0,1,1,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1],
  [0,0,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,1,1,0,0,1,0,1,1,1,0,1,0,0,1,0,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,0,0,1,0,1,1,0,1,1,1,1],
  [1,0,1,1,1,1,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,0,0,1,1,0,1,1,0,1,1,1,0,1,1,0,0,1,0,1,1,1,1,0,1,0,1,1,1,1,0,0,1,1,0,0],
  [1,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1],
  [1,1,1,1,0,0,1,1,0,0,1,1,1,0,0,1,0,1,1,1,0,0,0,1,0,0,1,0,0,1,0,0,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,0],
  [1,1,1,1,1,0,1,1,1,1,0,0,1,1,0,0,1,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,0,0,1,0,1,1,1,1],
  [1,1,1,1,0,1,1,1,1,1,1,0,1,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,0,1,1,1],
  [1,0,1,1,1,1,1,0,0,1,0,1,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1,1,1,1,0,0,0,1,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
  [0,0,1,1,0,1,1,1,1,1,0,0,1,0,0,0,1,0,1,1,0,0,1,0,0,0,0,0,0,1,0,1,1,0,0,1,0,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1],
  [0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,1,0,1,1,1,0,0,1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,0],
  [1,0,1,1,0,1,1,0,0,1,0,0,0,0,0,0,1,0,1,1,0,1,1,0,0,0,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,1,0],
  [1,0,1,1,0,1,1,0,0,1,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,0,0,1,0,1],
  [1,1,1,1,0,1,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0],
  [0,1,1,1,0,1,1,0,1,1,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,1,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1],
  [0,1,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,1,0,0,0,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1],
  [0,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,0,1,1,1,0,1,1,0,1,1,1,0,1],
  [1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,0,0,0,1,0,1,0,0,1,1,0,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,0,1],
  [0,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,0,1,0,1,1,1,0,1,0,0,1,0,0,1,1],
  [1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,0,1,1,0,1,1,0,0,1,0,1,1,0,0,1,0,0,1,1,1,1,1,1,1,1],
  [1,0,1,1,0,0,1,0,1,0,0,1,1,0,1,1,0,0,0,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,1,0,1,1],
  [1,1,1,1,0,0,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,1,1,1,0,1,1],
  [1,1,1,0,0,1,1,0,0,1,0,1,0,0,0,1,1,0,1,0,0,1,1,0,1,1,0,0,1,1,0,1,0,1,1,1,0,0,1,0,1,0,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,1],
  [1,1,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,0,1,1,1,1,0,1,1,0,0,0,1],
  [1,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,0,1,1,1,1,1,0,0,1,1,0,0,0],
  [1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,1,0,0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1],
  [1,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,0,1],
  [1,1,1,0,1,0,0,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1],
  [1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,0,1],
  [1,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,0,1],
  [0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,1,1,1,0,0,0,0,1,1,0,1,0,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,0],
  [1,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,1,0,1,0,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,0,0,1],
  [1,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1],
  [1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,1,1],
  [1,0,1,1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,0,1,1,1,1,1,1,1,0,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1]
]
{{< / highlight >}}
</details>

# Presentation

The generated data structure had to become part of the IIIF manifest so that it could be integrated with the digitised image using the usual functionality (like zooming). In a manifest, annotations can be used to create references between descriptive data and image regions, this capability was also used here.

However, this required a further data preparation step: Even if almost half of the points were discarded because they contained no necessary information (in the example above "0"), there were still 1232 points left over. Therefore, the contiguous areas were summarised and care was taken to ensure that no "holes" were closed. At the end of this optimisation, 120 areas remained, which are represented as SVG polygons:

{{< figure src="./single.jpg" caption="Individual squares" >}}

{{< figure src="./merged.jpg" caption="Polygons" >}}

These SVG polygons can be translated into [web annotations](https://www.w3.org/TR/annotation-model/) and embedded directly in the IIIF manifest. As such a content type has not yet been provided for, it still had to be defined.

<details>
  <summary>Example: The second polygon as an annotation</summary>
  {{< highlight json >}}
  {
    "id": "http://localhost:5173/canvas/page031/annotation/0/touch/1",
    "type": "Annotation",
    "motivation": "sensing",
    "body": {
      "id": "http://localhost:5173/canvas/page031/annotation/0/touch/1/body",
      "type": "InteractiveResource",
      "haptics": { "vibrate": true }
    },
    "target": {
      "type": "SpecificResource",
      "source": "http://localhost:5173/canvas/page031",
      "selector": {
        "type": "SvgSelector",
        "value": "<svg  xmlns=\"http://www.w3.org/2000/svg\"><polygon points=\"805,596 806,596 829,596 853,596 853,572 829,572 806,572 805,572 782,572 758,572 758,596 782,596\" /></svg>"
      }
    }
  }
  {{< / highlight >}}

  The required extension is defined [here](https://christianmahnke.de/iiif/touch/).
</details>

OpenSeadragon](https://openseadragon.github.io/) and [Annotorious](https://annotorious.dev/) are then used to display the result.

# Result

"Unfortunately", the Vibrate API is not supported by all browsers. The most promising candidate is certainly Chrome on Android, but even there a few basic conditions must be observed:
* Vibration must be activated
* Sound must be activated
* Power saving mode must be deactivated

Tested with Chrome on Android 12, 13 and 14.

Other potential browsers are listed by [Can I Use](https://caniuse.com/vibration), there is also a test page from the [Chrome project on Github](https://googlechrome.github.io/samples/vibration/).

{{< vibrate-check >}}

{{< iiif/touch-iiif manifestUrl="manifest-enriched.json" >}}

<a class="iiif-link" href="./manifest-enriched.json">IIIF-Manifest</a>

# Used libraries

* Image and data processing
  * [`jxlpy`](https://github.com/olokelo/jxlpy)
  * [VIPS](https://www.libvips.org/)
  * [Pillow](https://python-pillow.org/)
  * [IIIF-Prezi3](https://iiif-prezi.github.io/iiif-prezi3/)
  * [Shapely](https://shapely.readthedocs.io/en/stable/)

* Presentation
  * [OpenSeadragon](https://openseadragon.github.io/)
  * [Annotorious](https://annotorious.dev/)
  * [Manifesto](https://github.com/IIIF-Commons/manifesto)
