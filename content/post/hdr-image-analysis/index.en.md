---
date: 2024-06-06T11:33:44+02:00
title: "Contrast enhancement for UV images using HDR"
keywords: UV, ultraviolet, image analysis, Northeim, copy book, letters
description: "An old copy book from Northeim as an example of HDR visualisation of UV images"
preview:
  image: img/front.jpg
  hide: true
tags:
  - Light
  - Licht2024
  - DigitalImages
  - Object
---

This example is about a practical use case for [HDR](https://en.wikipedia.org/wiki/High_dynamic_range) visualisation in the browser...
<!--more-->

The example below currently only works with Chrome-based browsers (such as Edge or Brave), as these already support HDR with the HTML canvas element. There are two reasons for this:
* Standardisation is still ongoing
* Not all browsers implement new functions immediately

The piece shown is an excerpt from a copybook from the first half of the 1920s.

A copybook is a collection of copied letters in a book. These copies were not made using a photocopier, but were handwritten using a copying pen, then placed on one of the tissue paper pages, with the front and back wrapped in a kind of oilcloth to protect the other pages and pressed in this way. There were either corresponding presses or, as in this case, a cast-iron "protective cover", which was also the press.

This copy book belonged to Carl Spannaus, who in the course of the book also worked as a correspondent for the [Hannoverscher Kurier (German)](https://de.wikipedia.org/wiki/Hannoverscher_Kurier).

In the issue of Sunday 14 September 1902 (page 5) of the Hannoverscher Kurier, he is [listed (German)](https://digitale-sammlungen.gwlb.de/content/73496076X_HannoverscherKurier_19020914_01/pdf/00000005.pdf) as an agent of the newspaper and owner of a bookshop in Northeim. He also published [postcards (German)](https://ansichtskarten-lexikon.de/verlag-carl-spannaus-northeim-i-hann-14621.html). You can also read in [Spiegel (German)](https://www.spiegel.de/geschichte/ortstermin-a-946572.html) that he was the first citizen of Northeim who became member of the NSDAP...
And there are also some entries in the "Börsenblatt des deutschen Buchhandels".

This book also contains copies of stamp impressions. Some of the stamp colours used can be excited by UV radiation...

{{< gallery >}}
[
  {"src": "img/presse.jpg", "alt": "Press"},
  {"src": "img/front.jpg", "alt": "Book cover"},
  {"src": "img/page.jpg", "alt": "Page"}
]
{{</ gallery >}}

# Example

{{< hdr-canvas-check >}}

If the HDR check fails, the colours are not displayed in their full luminance. **Even if the display of HDR images works, the HDR support for the `canvas` element needs the browser flag `enable-experimental-web-platform-features` to be enabled. For example, open "chrome://flags#enable-experimental-web-platform-features" in Chrome to activate it.**

Currently, only the intensities of the individual channels can be adjusted, but in principle significantly more parameters are conceivable.
Therefore, the example only marginally increases readability in most settings, but makes the potential visible.

{{< hdr-canvas image="img/sample.jpeg" >}}
