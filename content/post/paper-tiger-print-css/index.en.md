---
date: 2025-12-10T18:33:44+02:00
title: "Paper tiger CSS for printing"
description: "A rant about CSS for printing"
keywords: PDF, VivlioStyle, CSS, PrinceCSS, XSL-FO
cite: true
tags:
  - CSS
  - Printing
  - JavaScript
wikidata:
  - https://www.wikidata.org/wiki/Q46441
  - https://www.wikidata.org/wiki/Q42332
  - https://www.wikidata.org/wiki/Q24415127
  - https://www.wikidata.org/wiki/Q32087
---

II occasionally engage in cross-media publishing...
<!--more-->

This has even led to a few projects in my professional life:
* 2004-2006: **The Rise of Modern Constitutionalism, 1776-1849**:
  A workflow was developed and implemented, that created TEI from Word files with theme-specific document templates. TEI was then converted into other presentation formats (including a book series).

* 2014: **OUS-Print**:
  Order slips/accompanying notes were created from the local library system: text is converted to PDF using XSL-FO. Templates can be edited in Open Office. There is also an [old presentation](https://subugoe.github.io/ous-print/slides.xhtml).

I have now attempted to create a catalogue from the Kleiderbügel blog and was surprised at how little current technologies have advanced in the last decade. Certainly, the demand for elaborately designed printed products has not necessarily increased in recent years. However, I had hoped that old XML technologies such as XSL-FO would have been replaced to some extent.

## CSS for printing

It therefore made sense to investigate what today's web technologies have to offer in this area. There is a small group of enthusiasts and providers on the internet who promote CSS for printing.

They advertise the appealing results of their work. The idea is fundamentally a very good one, because the possibilities offered by CSS today are in no way inferior to those of DTP software. There are also dedicated CSS modules for this purpose:
* primarily the [CSS Paged Media Module Level 3](https://www.w3.org/TR/css-page-3/):
  * [current version](https://drafts.csswg.org/css-page/) with the status "Editor's Draft"
* supplemented by the [CSS Generated Content Module Level 3](https://drafts.csswg.org/css-content-3/)

However, after the initial euphoria, the first major gap quickly becomes apparent:
The (remaining) major browsers only support the possible features to a limited extent. The lack of the following functionalities is particularly noticeable:
* Cross-references, e.g. for creating tables of contents
* Footnotes
* Print-specific design elements such as fill characters (`leader`)

**If browsers supported these features, this article would probably be over by now...**

But they don't. Still, there's no reason to despair, because there are other implementations, both open source and commercial. An overview is provided by [print-css.rocks](https://print-css.rocks/). The site offers extensive compatibility tests, as well as ratings and classifications.

Basically, the implementations can be divided into two types according to how they work:
* Browser-based: Remotely control an existing browser implementation (usually Chromium) and implement the missing CSS features as polyfills. They are, so to speak, the grandchildren of [wkhtmltpdf](https://wkhtmltopdf.org/).
* Own CSS implementation: This uses an (usually self-written) HTML/CSS renderer.

The first approach has the charm of enabling JavaScript to be executed without any major problems. This also allows the reuse of dynamically generated images, such as diagrams or maps.

Since the market is quite fragmented and resources are therefore limited, not all of them have the same degree of standard compliance. Ultimately, this means that one does not adhere to a standard, but rather to the smallest common subset that is supported by everyone. The alternative is to commit to a specific implementation.

It doesn't help that some of the processors also come with vendor-specific CSS extensions.

## Are the implementations the only problem?

However, the real problems seem to lie elsewhere:
What is currently referred to as CSS for printing is largely underambitious, at least when it comes to bound materials: The primary goal seems to be the layout of individual (form) sheets, such as invoices or advertising letters. There are also more complex examples, such as (scientific) papers or technical documentation in book form, but here too, one has to ask whether these are not intended more for reading as PDFs on screen.

Sure, that will account for the majority of use cases. Those who want more can use DTP software such as InDesign.

**But is this really a claim that a community for open standards should be satisfied with?**

Basically, it would be desirable if the creative freedom that CSS offers web designers and developers were also available in the printing sector. And not just for loose-leaf collections.

### Or is it the specification?

A feeling that often creeps up on you with CSS also arises here: "ease of implementation" seems to be more important than "ease of use" or even "feature completeness".

Many of the functionalities mentioned under "What's missing?" quickly become apparent when you start creating books (or more complex brochures). Some of them can even be found in the W3C's [list of CSS functions required for paginated media](https://www.w3.org/Style/2013/paged-media-tasks), but they have never been included in the specification. This part would certainly have been solved within the framework of the [CSS regions module](https://www.w3.org/TR/css-regions-1/), but this was also [never implemented](https://caniuse.com/css-regions).

## What's missing?
An important goal (apart from presentation) of CSS for printing should be to reduce the amount of pre-processing required. In my case, these were:

* Footnotes: It is somewhat limited to simply specify fixed areas for a page type. It would also be desirable to be able to specify an existing container. The module for generated content could also be used for this.
* Binding edge: The binding edge is essential for printed works of a certain size. Therefore, it should be supported in the same way as media queries for landscape and portrait formats. This includes the selectors contained therein.
* Overflow into other containers: The module for generated content should be able to "catch" the overflow of another container.

Further improvements are also conceivable:
* Currently, the page margins are divided into [fixed zones](https://www.w3.org/TR/css-page-3/#margin-boxes). This should be changeable.
* Effects in particular need to be defined, e.g. as a blacklist (i.e. what should not work). One example is `text-shadow`. Here, the basic rule could be that everything that is possible in SVG or modern PDF (let's not kid ourselves, there is usually another intermediate format before printing) should also be printable. A valid basic rule would not be: "These are GPU effects and therefore can't be printed", because this is an implementation detail. If necessary, a `raster` property could be invented.

In addition, there are additions that would also benefit CSS in the browser, such as text that adapts to the size of the container.

Until then, one should be more cautious when claiming that CSS is truly print-ready, as this otherwise gives the impression that it is as simple as the display in the browser, regardless of the desired print product.

## A possible way (out)

If we assume that browser vendors do not fully support CSS for printing, there is no need to be overly cautious when defining a standard. On the contrary, this should actually speed up the process, as it reduces restrictions. One could even argue, somewhat polemically, that browser vendors should first implement the existing specifications in order to have a say – as proof, so to speak, that they are stakeholders.
Against this backdrop, smaller vendors and projects that create processors should not allow themselves to be slowed down by the process.

And then the scope of the specification to be created should also be clarified, i.e. the types of documents that should be able to be created with its help.
Incidentally, this also includes explicitly bearing in mind that it is not just about creating PDFs, but about printed information on paper: "printing" is a very broad field. Sometimes you want to create more than just the preliminary stage of waste paper.

If several vendors bring their own CSS extensions that achieve the same result, then something has gone wrong with the specification. Otherwise, the respective use case would have been taken into account.
It may also help to find an end with the existing specification(s). Perhaps starting with a "CSS Paged Media Module Level 4" would solve some of the problems.

Ultimately, it is necessary to check whether everything that can be done with XSL-FO 1.1 can be achieved with the existing specification; if not, it is back to the drawing board. Offering a migration path would show that the authors are serious about theitr product...

Against this background, it may be worth considering abandoning the existing standardisation path and putting your efforts into your own approach instead. An (inactive) example of such an initiative is [CSS Books](https://books.idea.whatwg.org/).

## Conclusion

CSS for printing is, in part, a paper tiger: it works for simple, unbound documents. However, as the size or scope of a project increases, the amount of pre-processing required increases massively. (Sometimes so much so that you remember that Inkscape can be scripted with Python.) Currently, there is no major breakthrough in sight for the specification, and the major browser vendors show no discernible interest in improving the situation.

If you need ideas on how to do it better, you can (ironically) read about them at the W3C.

## Thanks

* To Andreas Jung, who created the website [print-css.rocks](https://print-css.rocks/), which was a valuable source of information.
* The team at [Vivliostyle](https://vivliostyle.org/), which came closest to meeting my requirements and is therefore the one I use.
