---
date: 2025-09-27T11:22:44+02:00
title: "Von Mirador zu Tify"
tags:
  - Projektemacher.org
  - Blog
  - IIIF
---
Projektemacher.org now uses Tify...
<!--more-->

Until now, my [Projektemacher blogs](https://projektemacher.org/blogs/) have used the IIIF viewer "[Mirador](https://projectmirador.org/)" to display IIIF presentation manifests. This has now changed for various reasons:

In recent years, using Mirador has become increasingly complicated because a [change to support "gaps" in page sequences (PR #2029)](https://github.com/ProjectMirador/mirador/pull/3029) was never incorporated into the main branch. Since the change was not further maintained, the viewer remained frozen at the status of a development version from early 2024.

At the same time, I have been flirting with the IIIF viewer "[Tify](https://tify.rocks/)" for some time, partly because I know the people involved in its development. Until now, development has not been focused on widespread use, so there have also been problems with gaps in page sequences and deficits in full compatibility with static IIIF images (Level 0).

Now, last week, [version 0.34 of Tify](https://github.com/tify-iiif-viewer/tify/releases/tag/v0.34.0) was released, and after years of waiting, this version finally offers support for IIIF Image API [2.1 `viewingHint`](https://iiif.io/api/presentation/2.1/#viewinghint) and [3.0 `behavior`](https://iiif.io/api/presentation/3.0/#behavior) as well as pre-generated thumbnails. In addition, Tify is significantly slimmer.

**That's why my blogs now use Tify to display IIIF presentation manifests!**

Hopefully, development will continue along the new path toward a generally usable IIIF viewer and will also supplement the [display of IIIF Image API endpoints](https://github.com/tify-iiif-viewer/tify/issues/129).
