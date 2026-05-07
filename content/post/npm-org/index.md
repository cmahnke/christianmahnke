---
date: 2026-05-07T19:45:44+02:00
title: "NPM Organisation"
cite: true
keywords: NPM
tags:
  - SoftwareDevelopment
  - JavaScript
wikidata:
  - https://www.wikidata.org/wiki/Q978185
  - https://www.wikidata.org/wiki/Q7067518
---

Ich habe eine NPM "Organisation" angelegt.
<!--more-->

Bisher habe ich nur zwei JavaScript-Artefakte veröffentlicht:
* Die [JavaScript Bibliothek für HDR](/post/hdr-canvas-js/)
* Das [Rollup-Plugin für WASM Inlining](/post/rollup-plugin-wasm-brotli/)

Um jedoch auch mehr oder weniger interne Tools und Module besser verwalten zu können, werden diese nun auch als NPM-Pakete veröffentlicht. Da die GitHub-interne Paket-Registry auch für öffentliche Pakete eine Authentifizierung erfordert, ist sie für meine Zwecke zu komplex zu integrieren.

Das `hdr-canvas`-Paket wird dann mit der nächsten Version umziehen.

Daher gibt es nun die "Organisation" [`@projektemacher`](https://www.npmjs.com/org/projektemacher) um alles unter einem Dach zu bündeln.