---
date: 2024-06-06T11:33:44+02:00
title: "Contrast enhancement for UV images using HDR"
tags:
  - light
  - Licht2024
  - digitalImages
---

# Image analysis using HDR visualisation

This example is about a practical use case for HDR visualisation in the browser.

The example below currently only works with Chrome-based browsers (such as Edge or Brave), as these already support HDR with the HTML canvas element. There are two reasons for this:
* Standardisation is still ongoing
* Not all browsers implement new functions immediately

The piece shown is an excerpt from a copybook from the first half of the 1920s.

A copybook is a collection of copied letters in a book. These copies were not made using a photocopier, but were handwritten using a copying pen, then placed on one of the tissue paper pages, with the front and back wrapped in a kind of oilcloth to protect the other pages and pressed in this way. There were either corresponding presses or, as in this case, a cast-iron "protective cover", which was also the press.

This copy book belonged to , who in the later course of the book apparently also worked as a correspondent for the [Hannoverscher Kurier](https://de.wikipedia.org/wiki/Hannoverscher_Kurier).

This book also contains copies of stamp impressions. Some of the stamp colours used can be excited by UV radiation...

# Example

{{< hdr-canvas-check >}}

If the HDR check fails, the colours are not displayed in their full luminance. Currently, only the intensities of the individual channels can be adjusted, but in principle significantly more parameters are conceivable.
Therefore, the example only marginally increases readability in most settings, but makes the potential visible.

{{< hdr-canvas image="img/sample.jpeg" >}}
