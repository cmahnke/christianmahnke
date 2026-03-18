---
date: 2026-02-18T19:22:44+02:00
title: "Blog posts at Zenodo"
cite: true
draft: true
tags:
  - Blog
  - Archive
---

More elaborate blog posts will now also be published on Zenodo...
<!--more-->

...after experiments by the DNB to archive my blogs on the web in early 2024 were unsuccessful and the limits of the Internet Archive have been increasingly reduced recently, so that the archiving of this blog (and the linked pages) no longer works reliably, selected posts are now being published as PDFs on Zenodo.

The technical implementation uses [Vivliostyle](https://vivliostyle.org/) to generate the individual PDFs and the Python module [`zenodo-client`](https://github.com/cthoyt/zenodo-client) to upload the PDFs.

For the metadata modelling, I followed the article [‘Making your blog FAIR’](https://drmowinckels.io/blog/2024/fair-blog/) by Athanasia Mo Mowinckel.

## Technical implementation

For the implementation, a separate Hugo output format was defined for PDF generation. The only difference is that a customised CSS for HTML is provided. The generated output data is then searched for in the output directory using a simple script and transferred to Vivliostyle to generate PDFs.
In the next step, the resulting files are then compared with the metadata of the respective blog posts.

