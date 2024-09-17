---
date: 2022-01-26T11:44:44+02:00
title: "IIIF Proxy"
preview:
  image: img/Proxy-DE-611-HS-3461927_00000016.png
  hide: true
tags:
  - IIIF
  - OpenCV
  - DigitalImages
---

To improve the 'displayability' of digital objects such as coins and books, I have written a proxy for IIIF resources...
<!--more-->

The digital collections of the University of Göttingen are mainly fed from two portals:
* [Scientific Collections of the Georg-August-Universität Göttingen](https://sammlungen.uni-goettingen.de/index/)
* [Göttingen Digitisation Centre](https://gdz.sub.uni-goettingen.de/)

Both make their digitised material available via [IIIF](https://iiif.io/). Unfortunately, the images provided are not optimised for aesthetically pleasing secondary use.

In order to minimise manual post-processing and the resulting storage effort, I have slightly extended an existing IIIF server - [Hymir from MDZ](https://github.com/dbmdz/iiif-server-hymir/) - so that it is able to sit on an institutional server and process the images delivered by it.

In order to keep the image processing configurable, a field of the IIIF Image API is used to specify the operation. The [`quality`](https://iiif.io/api/image/2.1/#quality) field was suitable for this, the proxy allows:
* `nofold` - remove page fold
* `transparent-background` - Transparent background
* `nofold+transparentbg` - both together

For the image operations themselves, [OpenCV](https://opencv.org/) is used, whereby the background is simply removed with a threshold value and only at the edges - i.e. made transparent. Recognising the folds is a little more complicated, but it's not rocket surgery either:
* Recognising lines ([Probabilistic Hough Line Transform](https://en.wikipedia.org/wiki/Hough_transform)) in the fold area depending on whether they are left or right-sided
* Sorting the recognised lines by angle and length to identify the most likely candidate of the fold
* Rotate to align the detected fold vertically

But here the reliability could be improved.

# Examples

The following examples show digital copies in the respective portal and in the viewer of the proxy. The viewer of the proxy allows the background colour to be changed in order to increase the contrast. A blue background is preset in the examples.

## Transparent background

{{< gallery >}}
[
  {"src": "img/Sammlungsportal-record_DE-MUS-062622_kenom_127703.png", "alt": "Before"},
  {"src": "img/Proxy-record_DE-MUS-062622_kenom_127703.png", "alt": "After"}
]
{{</ gallery >}}

[Original presentation](https://sammlungen.uni-goettingen.de/objekt/record_DE-MUS-062622_kenom_127703/)

<div class="small-font-right">
Picture: Coin Cabinet of the University of Göttingen, Stephan Eckardt, Archaeological Institute Göttingen, 2014 / Licence: Namensnennung - Nicht kommerziell 4.0 (CC BY-NC 4.0)
</div>

## Without page fold

And with transparent background...

{{< gallery >}}
[
  {"src": "img/GDZ-DE-611-HS-3461927_00000016.png", "alt": "Before"},
  {"src": "img/Proxy-DE-611-HS-3461927_00000016.png", "alt": "After"}
]
{{</ gallery >}}

[Original presentation](https://gdz.sub.uni-goettingen.de/id/DE-611-HS-3461927?tify=%7B%22pages%22%3A%5B16%5D%2C%22view%22%3A%22info%22%7D)

<div class="small-font-right">
Picture: Niedersächsische Staats- und Universitätsbibliothek Göttingen / Licence: Public Domain Mark 1.0 (PDM)
</div>

<br>

The project is available on [GitHub](https://github.com/cmahnke/iiif-proxy).

# Update 11.4.22

Due to time constraints, the project will not be continued for the time being, especially as the upstream project is not very active at the moment...
