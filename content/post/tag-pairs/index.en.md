---
date: 2025-05-25T11:22:44+02:00
title: "Keyword pairs visualised"
scss: scss/tag-ring/tag-ring.scss
js:
  - ts/tag-ring/tag-ring.ts
tags:
  - Visualisation
  - Website
  - D3.js
---
Sometimes experiments don't bring the desired results...
<!--more-->

...also in this case:

After more than four years, the posts on this blog (now totalling around 100) are slowly becoming confusing, so I've been thinking for some time about how to make them more thematically accessible.

So here is an attempt to visualise keyword pairings.

<div id="chordContainer" class="tag-ring">
  <p style="text-align: center; color: #777">Load diagram...</p>
</div>

But since the whole thing does not work as well visually as hoped, some obvious weaknesses are no longer eliminated:
* The colours of the lines should change via a gradient when they run into the opposite block.
* The display on mobile devices is suboptimal

Maybe it's time for a classic search function...
