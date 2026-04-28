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

Nach meinen [Erfahrungen mit WASM](/post/wasm-dx/) habe ich einen eigenes [Rollup](https://rollupjs.org/)-Plugin geschrieben.
<!--more-->

Schon vor einigen Jahren gab es hier einen [Artikel](https://christianmahnke.de/post/json-compression/), der den innovativen Ansatz zur Kompression von JSON namens `brotli-unicode` vorstellte. Nachdem ich mich nun mit WASM beschäftigen "musste", lag es nahe, die beschriebenen Unzulänglichkeiten damit zu kompensieren.

Herausgekommen ist ein Plug-in für Rollup, das das Bundling von WASM-Dateien deutlich vereinfacht, indem es die Datei einfach in die erstellte JavaScript-Datei integriert (inline), ohne die klassischen Nachteile der Base64-Kodierung (Größenzuwachs um 33–37 %) zu haben. 

## Vergleichszahlen

Dieser Vergleich basiert auf der Implementierung aus diesem [Blogbeitrag](https://christianmahnke.de/post/blog-sparql/), der [OxiGraph](https://github.com/oxigraph/oxigraph) und das [HDT-Rust-Modul](https://github.com/KonradHoeffner/hdt) umfasst.

### Ohne Plugin

| Größe (Bytes) | Datei                                  |
| ------------- | -------------------------------------- |
| 1,191,284     | wikidata-hdt/dist/client-sparql.js     |
| 2,609,124     | wikidata-hdt/dist/client-sparql.js.map |
| 714           | wikidata-hdt/dist/client-sparql.scss   |
| 181,638       | wikidata-hdt/dist/hdt_bg.wasm          |
| 3,954,968     | wikidata-hdt/dist/web_bg.wasm          |

Ohne das Plugin werden die Datei `wikidata-hdt/dist/client-sparql.js` sowie beide WASM-Dateien benötigt. Insgesamt 5.327.890 Byte.

### Mit Plugin

| Größe (Bytes) | Datei                                  |
| ------------- | -------------------------------------- |
| 3,060,899     | wikidata-hdt/dist/client-sparql.js     |
| 4,493,750     | wikidata-hdt/dist/client-sparql.js.map |
| 714           | wikidata-hdt/dist/client-sparql.scss   |
| 181,638       | wikidata-hdt/dist/hdt_bg.wasm          |
| 3,954,968     | wikidata-hdt/dist/web_bg.wasm          |

Für das Plugin wird lediglich die Datei `wikidata-hdt/dist/client-sparql.js` benötigt. Insgesamt 3.060.899. Das entspricht etwa 57,4 % der ursprünglichen Größe.

Das [Plugin ist über NPM](https://www.npmjs.com/package/@projektemacher/rollup-plugin-wasm-brotli) verfügbar, der Quellcode bei [GitHub](https://github.com/cmahnke/rollup-plugin-wasm-brotli) verfügbar.