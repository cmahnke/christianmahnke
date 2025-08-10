---
date: 2025-08-12T15:22:44+02:00
title: "hdr-canvas 0.1.0 published"
keywords: NPM, TypeScript
cite: true
tags:
  - JavaScript
  - HDR
wikidata:
  - https://www.wikidata.org/wiki/Q7067518
  - https://www.wikidata.org/wiki/Q2005
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q978185
draft: true
---

`hdr-canvas` version 0.1.0 released...
<!--more-->

One result of my work with HDR content in the browser is an NPM module, which was also used to create the posts in this blog.
However, about a year has passed since the first versions and the browser API was rather experimental at that time. A lot has changed since then - one of the examples had even stopped working in the meantime: The most important change concerns the change from `Uint16` to `Float16` as 16 bit pixel data type for HDR.

Since browsers are developing rapidly and the use of older browsers is not recommended for security reasons (even if some people see it differently), **no downward compatibility** is to be expected.

In addition to the necessary adjustments, the new version also offers improvements in the area of documentation and examples.

The code can be found on [GitHub](https://github.com/cmahnke/hdr-canvas) and [NPM](https://www.npmjs.com/package/hdr-canvas).
