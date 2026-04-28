---
date: 2026-04-28T21:45:44+02:00
title: "Rollup plugin für WASM Inlining"
cite: true
keywords: Brotli, WASM, Rollup
tags:
  - SoftwareDevelopment
  - JavaScript
wikidata:
  - https://www.wikidata.org/wiki/Q7067518
  - https://www.wikidata.org/wiki/Q20155677
  - https://www.wikidata.org/wiki/Q114900810
  - https://www.wikidata.org/wiki/Q18205644
  - https://www.wikidata.org/wiki/Q2493
  - https://www.wikidata.org/wiki/Q726780
---

Based on my [experience with WASM](/post/wasm-dx/), I’ve written my own [Rollup](https://rollupjs.org/) plugin.
<!--more-->

A few years ago, there was an [article](https://christianmahnke.de/post/json-compression/) here that introduced an innovative approach to JSON compression called `brotli-unicode`. Now that I’ve had to get to grips with WASM, it made sense to use it to compensate for the shortcomings described.

The result is a plugin for Rollup that significantly simplifies the bundling of WASM files by simply integrating the file into the generated JavaScript file (inline), without the classic drawbacks of Base64 encoding (33–37% increase in size). 

## Comparative figures

This comparison is based on the implementation from this [blog post](https://christianmahnke.de/post/blog-sparql/), which includes [OxiGraph](https://github.com/oxigraph/oxigraph) and the [HDT Rust module](https://github.com/KonradHoeffner/hdt).

### Without plugin

| Size (bytes)  | File                                  |
| ------------- | -------------------------------------- |
| 1,191,284     | wikidata-hdt/dist/client-sparql.js     |
| 2,609,124     | wikidata-hdt/dist/client-sparql.js.map |
| 714           | wikidata-hdt/dist/client-sparql.scss   |
| 181,638       | wikidata-hdt/dist/hdt_bg.wasm          |
| 3,954,968     | wikidata-hdt/dist/web_bg.wasm          |

Ohne das Plugin werden die Datei `wikidata-hdt/dist/client-sparql.js` sowie beide WASM-Dateien benötigt. Insgesamt 5.327.890 Byte.

### With plugin

|  Size (bytes) | File                                   |
| ------------- | -------------------------------------- |
| 3,060,899     | wikidata-hdt/dist/client-sparql.js     |
| 4,493,750     | wikidata-hdt/dist/client-sparql.js.map |
| 714           | wikidata-hdt/dist/client-sparql.scss   |
| 181,638       | wikidata-hdt/dist/hdt_bg.wasm          |
| 3,954,968     | wikidata-hdt/dist/web_bg.wasm          |

The plugin requires only the file `wikidata-hdt/dist/client-sparql.js`. Total size: 3,060,899 bytes. This corresponds to approximately 57.4% of the original size.

The [plugin is available via NPM](https://www.npmjs.com/package/@projektemacher/rollup-plugin-wasm-brotli), and the source code is available on [GitHub](https://github.com/cmahnke/rollup-plugin-wasm-brotli).