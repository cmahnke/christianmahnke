---
date: 2026-08-09T23:30:44+02:00
title: 'Never Built Göttingen in 3D'
class: never
pagetheme: white
cite: true
tags:
  - Blog
  - Projektemacher.org
  - Architecture
  - Göttingen
  - UrbanPlanning
  - 3D
  - Geodata
  - OpenStreetMap
preview:
  image: img/screenshot.png
  hide: false
wikidata:
  - https://www.wikidata.org/wiki/Q8180985
  - https://www.wikidata.org/wiki/Q152838
  - https://www.wikidata.org/wiki/Q713750
  - https://www.wikidata.org/wiki/Q110609581
  - https://www.wikidata.org/wiki/Q116859588
---

Following the launch of "[Never Built Göttingen](https://never-built.goettingen.xyz/)" in spring 2025, a new 3D visualisation is now available.
<!--more-->

Compared to the prototype from [November 2025](/en/post/patching-osm-data/), the visualisation is now "prettier": anti-aliasing has been applied and trees are displayed. The data processing is also much more sophisticated, meaning that alternative road alignments are now shown as well.

{{< zoom-link link="https://never-built.goettingen.xyz/3d-map/" title="Never Build Göttingen 3D" >}}
    {{< figure src="img/screenshot.png" alt="Screenshot of Never Build Göttingen 3D" class="post-image" >}}
{{< /zoom-link >}}

As only a fraction of the buildings are currently modelled, this is merely a preview that is not yet linked on the page itself.

For the implementation, [Planetier](https://github.com/onthegomap/planetiler) was used to create the vector tiles featuring the buildings and trees, and [Maplibe GL JS](https://maplibre.org/projects/gl-js/) was used for the 3D rendering in the browser.
