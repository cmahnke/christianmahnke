---
date: 2020-12-04T18:22:44+02:00
title: "Tactile Feedback"
description: "A page from 'Textil-Atlas: ein Lehrbuch und Nachschlagebuch für den Textileinzelhandel und die Gewebeverarbeitung: Textilwarenkunde und Gewebemuster von Wilhelm Spitschka'"
tags:
- IIIF
- TactileFeedback
draft: true
iiifContext: http://iiif.io/api/presentation/2/context.json
outputs:
- html
- iiif-manifest
resources:
- src: "page031.jpg"
  params:
    iiif: page031/info.json
    hint: non-paged
    label: Tafel 31
---

Since one of the goals of this blog is to find ways to transport analog content into digital space, here is an attempt to make fabrics tangible ...

<!--more-->

# Preparation of image data

These steps can be configured for each individual image section. The goal is to transfer image data into a grid of tangible points. The following still has to be determined experimentally:

* Which edge length for points would be optimal - currently 1mm
* How many levels of intensity are useful - currently only 2 (on and off)

{{< figure src="./page031-0-cut.png" caption="Extracted section" >}}

{{< figure src="./page031-0-filter_0_FIND_EDGES.png" caption="Edge detection" >}}

{{< figure src="./page031-0-filter_1_EDGE_ENHANCE.png" caption="Edge enhancement" >}}

{{< figure src="./page031-0-filter_2_SMOOTH_MORE.png" caption="Smoothen 1" >}}

{{< figure src="./page031-0-filter_3_SMOOTH_MORE.png" caption="Smoothen 2" >}}

{{< figure src="./page031-0-filter_4_GRAYSCALE.png" caption="Grayscaling" >}}

{{< figure src="./page031-0-filter_5_EQUALIZE.png" caption="Average" >}}

{{< figure src="./page031-0-filter_6_BINARIZE.png" caption="Binarisation" >}}

{{< figure src="./page031-0.png" caption="scaled down to a edge length of 1mm" >}}

# Result

Currently without enriched contents.

{{< iiif/mirador manifestUrl="manifest.json" >}}
