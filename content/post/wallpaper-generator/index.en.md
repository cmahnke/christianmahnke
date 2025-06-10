---
date: 2025-06-09T23:22:44+02:00
title: "Wallpaper virtual rooms!"
preview:
  image: screenshot.png
  hide: true
class: lucienne
cite: true
pagetheme: white
tags:
- Projektemacher.org
- Blog
- IIIF
- DigitalImages
draft: true
---

Since I have an extensive collection of patterned papers, it was time to do something with them...

<!--more-->
Since Corona, it has been common to look into each other's booths in video conferences. While some tried interesting perspectives or the black and white mode, it became common during the subsequent AI boom to use filters to blur backgrounds so that you don't have to screw an eccentric guitar, bicycle or art collection to the wall.

And to bring the two together, there is now an interactive toy for the [‘Vorsatzpapier’ blog](https://vorsatzpapier.projektemacher.org/), a pattern generator that can work directly with the IIIF manifests provided.

{{< lucienne src=`{"Vorsatzpapier Collection": "https://vorsatzpapier.projektemacher.org/patterns/collection.json"}` urlInput=true resize=true download=true >}}

The software is named after the designer [Lucienne Day](https://en.wikipedia.org/wiki/Lucienne_Day), who also became famous for her textile and wallpaper designs of the 50s and 60s.

On this page there is a variant where the source material can be freely selected:


# Technical details

The following JavaScript modules were used for the implementation:
* [OpenSeadragon](https://openseadragon.github.io/)
* [OpenSeaDragon - FabricJS Plugin](https://github.com/brunoocastro/openseadragon-fabric)
* [Allmaps iiif-parser](https://allmaps.org/)
* [Fabric.js](https://fabricjs.com/)
* [i18next](https://www.i18next.com/)
* [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector)
