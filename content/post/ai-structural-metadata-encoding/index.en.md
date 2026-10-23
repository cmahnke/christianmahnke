---
date: 2026-10-16T19:52:22+02:00
title: 'AI for structural metadata'
params:
  cite: true
  wikidata:
    - https://www.wikidata.org/wiki/Q8275050
    - https://www.wikidata.org/wiki/Q148443
    - https://www.wikidata.org/wiki/Q59164046
tags:
- Metadata
- AI
- OCR
---

The [Kinderbücher](https://xn--kinderbcher-zhb.projektemacher.org/) (children’s books) now have structural metadata...
<!--more-->

They can be found behind the "Contents" button and viewed in the viewer.

What’s "special" about them is that they’ve been created entirely with the help of an LLM.

My previous OCR experiments with AI haven’t always yielded the desired results, but that was mostly because I was expecting coordinates at the same time – something that general-purpose LLMs aren’t really capable of; all they do is make them up. However, for the simple mapping required in this case, their capabilities are more than sufficient: the model simply needs to recognise which text appears on which page. This yields the chapters, along with simple structures such as the book cover and spine. The latter (and a few others) were specified via the prompt.

And as the example [Father is at War (https://xn--kinderbcher-zhb.projektemacher.org/post/vater-ist-im-kriege/)] shows, even Fraktur script is no problem.

Incidentally, the book [1x1 des Tapezierens – Versuch's mal selber!](https://vorsatzpapier.projektemacher.org/post/1x1-des-tapezierens/) on [Vorsatzpapier](https://vorsatzpapier.projektemacher.org/) has also been processed, and it shows that even nested structures work. It demonstrates a different approach: in the case of this book, only the table of contents (and, initially, the pagination sequence) was recognised. This approach is quicker and more cost-effective because not every page had to be processed.
