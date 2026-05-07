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

I’ve created an NPM "organisation".
<!--more-->

So far, I’ve only published two JavaScript artefacts:
* The [JavaScript library for HDR](/post/hdr-canvas-js/)
* The [Rollup plugin for WASM inlining](/post/rollup-plugin-wasm-brotli/)

However, in order to better manage more or less internal tools and modules, these are now also being published as NPM packages. As the GitHub internal package registry requires authentication even for public packages, it is too complex to integrate for my purposes.

The `hdr-canvas` package will therefore be moved in the next version.

Consequently, the ‘organisation’ [`@projektemacher`](https://www.npmjs.com/org/projektemacher) has been created to bring everything together under one roof.
