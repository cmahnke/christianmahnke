---
date: 2026-01-11T13:22:44+02:00
title: "Linked Art Metadaten"
keywords: Linked Art, Linked Data, Art, 
cite: true
tags:
  - Metadata
  - LOD
  - JSON
wikidata:
  - https://www.wikidata.org/wiki/Q115616582
  - https://www.wikidata.org/wiki/Q6108942
  - https://www.wikidata.org/wiki/Q1249973
  - https://www.wikidata.org/wiki/Q624005
---

In preparation for future experiments, linked art metadata is now available for some entries...
<!--more-->

For many posts that show [artworks](https://christianmahnke.de/tags/Art/), this blog now has [Linked Art](https://linked.art/) metadata. 

Linked Art is a metadata standard that was developed specifically for describing cultural objects and their provenance (i.e. history). It is based on the [CIDOC-CRM](https://cidoc-crm.org/) data model and uses [JSON-LD](https://de.wikipedia.org/wiki/JSON-LD) to exchange information about artworks, artists and provenances in a web-based and machine-readable format. This makes it similar to [LIDO].

Examples for individual posts / pages:

* [Flamingo by Fritz Neumann](/collections/donations/spandau/linkedart.json)
* [Kinder byElsa Haensgen-Dingkuhn](/post/print-elsa-haensgen-dingkuhn/linkedart.json)
* [Boltenhagen by Tadeusz Kaczmarek](/post/painting-kaczmarek-tadeusz/linkedart.json)


The respective JSON-LD files are referenced in the HTML header:
```html

<link rel="describedby" href="https://christianmahnke.de/post/painting-kaczmarek-tadeusz/linkedart.json" type="application/ld+json;profile='https://linked.art/ns/v1/linked-art.json'"/>
```

## Can you see anything yet?

Unfortunately, end users will have to wait a little longer for applications such as a browser extension for display. However, the main benefit will certainly be in the background, e.g. the networking of collections and collection objects or the display of additional information on a website...