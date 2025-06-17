---
date: 2025-06-09T23:22:44+02:00
title: "Wallpaper virtual rooms!"
preview:
  image: screenshot.png
  hide: true
cite: true
tags:
- Projektemacher.org
- Blog
- IIIF
- DigitalImages
- Fun
wikidata:
- https://www.wikidata.org/wiki/Q191529
---

Since I have an [extensive collection of patterned papers](https://vorsatzpapier.projektemacher.org/patterns/), it was time to do something with them...

<!--more-->
Since Corona, it has been common to look into each other's booths in video conferences. While some tried interesting perspectives or the black and white mode, it became common during the subsequent AI boom to use filters to blur backgrounds so that you don't have to screw an eccentric guitar, bicycle or art collection to the wall.

And to bring the two together, there is now an interactive toy for the [‘Vorsatzpapier’ Blog](https://vorsatzpapier.projektemacher.org/generator/), a pattern generator that can work directly with the IIIF manifests provided. On this page there is a variant where the source material can be freely selected by entering the URL to an IIIF manifest.

{{< lucienne uselocation=true src=`[{"label": "Sammlung Vorsatzpapier", "url": "https://vorsatzpapier.projektemacher.org/patterns/collection.json"}]` urlinput=true resize=true download=true >}}

# Operating instructions

**Important**: The display in mobile browsers may be compressed or incorrect.

Either a URL to an IIIF manifest can be entered in the upper field or the [Collection of wallpapers and endpapers](https://vorsatzpapier.projektemacher.org/patterns/) can be used. Depending on the type of manifest, the option to select an object or a page of an object will then appear. If, for example, only a single page is available, this will be selected automatically.

The desired digitized material then appears in the middle.

In the next step, the crop marks at the edges can be used to select the appropriate section. The icon with the square creates a square crop. The wheels at the bottom right can be used to set an alternating rotation around the set angle either horizontally or vertically.

A preview of the result is displayed in the lower window. It is also possible to set the number of rows and columns. After a change, click on “Update size”. It is also possible to download the result here. The content is always scaled to the width of the selected resolution. The symbol with the two arrows on the left-hand side can be used to make the content as wide as the preview window.

# Lucienne Day

The software is named after the designer [Lucienne Day](https://en.wikipedia.org/wiki/Lucienne_Day), who also became famous for her textile and wallpaper designs of the 50s and 60s.

# Technical details

The following JavaScript modules were used for the implementation:
* [OpenSeadragon](https://openseadragon.github.io/)
* [OpenSeaDragon - FabricJS Plugin](https://github.com/brunoocastro/openseadragon-fabric)
* [Allmaps iiif-parser](https://allmaps.org/)
* [Fabric.js](https://fabricjs.com/)
* [i18next](https://www.i18next.com/)
* [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector)

# Update 17.06.25

* Operating instructions added