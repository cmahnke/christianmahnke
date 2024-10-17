---
date: 2024-10-15T18:22:44+02:00
title: "Haptic Feedback"
description: "A page from 'Textil-Atlas: ein Lehrbuch und Nachschlagebuch für den Textileinzelhandel und die Gewebeverarbeitung: Textilwarenkunde und Gewebemuster von Wilhelm Spitschka'"
displayinlist: false
archive: false
news: false
tags:
- IIIF
- TactileFeedback
- DigitalImages
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

The first step is to prepare the image data: The starting point for tactile feedback are the image files, as well as a manual marker for the sections (bounding box) with fabric.

Height information is obtained from them with a little automated post-processing. However, there are only two gradations. These steps can be configured for each individual image section; after processing, the result is rasterised again to obtain a resolution of tangible points, using an edge length of 1 mm.

The Cordsamt (corduroy) serves as an example here:

{{< figure src="./page031-0-cut.png" caption="Extracted section" >}}

{{< figure src="./page031-0-filter_0_FIND_EDGES.png" caption="Edge detection" >}}

{{< figure src="./page031-0-filter_1_EDGE_ENHANCE.png" caption="Edge enhancement" >}}

{{< figure src="./page031-0-filter_2_SMOOTH_MORE.png" caption="Smoothen 1" >}}

{{< figure src="./page031-0-filter_3_SMOOTH_MORE.png" caption="Smoothen 2" >}}

{{< figure src="./page031-0-filter_4_GRAYSCALE.png" caption="Grayscaling" >}}

{{< figure src="./page031-0-filter_5_EQUALIZE.png" caption="Average" >}}

{{< figure src="./page031-0-filter_6_BINARIZE.png" caption="Binarisation" >}}

{{< figure src="./page031-0.png" caption="scaled down to a edge length of 1mm" >}}

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

In order for the generated data structure to be seamlessly integrated with the digitised image in the usual functionality, it must somehow become part of the IIIF manifest. this supports the creation of references to descriptive data on image regions via annotations. i.e. exactly what is needed here.

But even if you consider that you can throw away almost half of the points because they do not contain necessary information (in the example above "0"), there are still 1232 points left over. It is therefore necessary to summarise the contiguous areas, making sure that no holes are left out. At the end of this optimisation, 120 areas remain, which are represented as SVG polygons.

{{< figure src="./single.jpg" caption="Individual squares" >}}

{{< figure src="./merged.jpg" caption="Polygons" >}}

These SVG polygons can be translated into web annotations and embedded directly in the IIIF manifest.

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

OpenSeadragon](https://openseadragon.github.io/) and [Annotorious](https://annotorious.dev/) are then used to display this.

# Final result

"Unfortunately", the Vibrate API is not supported by all browsers. The most promising candidate is certainly Chrome on Android, but even there a few basic conditions must be observed:
* Vibration must be activated
* Sound must be activated
* Power saving mode must be deactivated

Other potential browsers are listed by [Can I Use](https://caniuse.com/vibration), there is also a test page from the [Chrome project on Github](https://googlechrome.github.io/samples/vibration/).

{{< vibrate-check >}}

{{< iiif/touch-iiif manifestUrl="manifest-enriched.json" >}}
