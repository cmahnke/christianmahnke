---
date: 2026-04-27T21:45:44+02:00
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
draft: true
---

Nach meinen [Erfahrungen mit WASM](/post/wasm-dx/) habe ich einen eigenes [Rollup](https://rollupjs.org/)-Plugin geschrieben.
<!--more-->

Vor eingen Jahren schon gab es hier einen [Artikel](https://christianmahnke.de/post/json-compression/), der den innovativen Ansatz zur Kompression von JSON namens `brotli-unicode` vorstellte. Nachdem ich mich nun mit WASM beschäftigen "musste", lag es nahe, die beschriebenen Unzulänglichkeiten damit zu kompensieren.

Herausgekommen ist ein Plugin für Rollup, das das Bundling von WASM-Dateien deutlich vereinfacht, indem es die Datei einfach in die erstellte JS-Datei integriert (inline), ohne die klassischen Nachteile der BASE64-Kodierung (33–37 % Größenzuwachs) zu haben. 

Das [Plugin ist auf GitHub](https://github.com/cmahnke/rollup-plugin-wasm-brotli) verfügbar.
