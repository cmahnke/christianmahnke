---
date: 2025-05-30T17:33:44+02:00
title: "Pagefind aufbohren"
keywords: Pagefind
description: ""
cite: true
tags:
  - Search
  - Pagefind
  - JSON
---

Since this page needs a search, I had a look at [Pagefind](https://pagefind.app/)...
<!--more-->
...and even though I originally had reservations about the integrability and flexibility, a very good friend (and the advantages) persuaded me to give it a try.

The advantages are quite simple:   
My pages are basically static HTML, dynamic content is realised exclusively in the client in JavaScript (or TypeScript). Therefore, a search must also manage without a classic search server such as [Solr](https://solr.apache.org/) or [ElasticSearch](https://www.elastic.co/elasticsearch).  
So far, I have been using [Fuse.js](https://www.fusejs.io/) for the [Project Maker Search](https://projektemacher.org/search/), for which the entire index is saved in a JSON file and always transferred in full to the searching client. Another JavaScript search that also works in this way is [Lunr.js](https://lunrjs.com/).  
This makes indexing itself quite fast, but does not scale properly if you want to index many pages, as the size of the data to be transferred scales linearly with the number of pages. There is also a solution here to reduce the amount of data to be transferred, see [article on JSON compression](/en/post/json-compression/), but in the end the (possibly mobile) client still needs all the data in memory.

Pagefind works differently at this point, only the required fragments of the index are transferred. A more detailed description can be found on the homepage.  
In addition, there are the relatively extensive options for enriching the index, which should also be used for this page.

From my point of view, the biggest disadvantage is a rather questionable design decision regarding configurability: what is classically known as index fields is realised in Pagefind via HTML data attributes (i.e. about as flexible or cool as inline CSS) or the use of the API. A simple external configuration file is not (yet) provided.

## Pagefind configuration

The following settings can be made via the data attributes; a rough distinction can be made between markers and playable fields. All begin with `data-pagefind-`, omitted here for clarity:

* Marker  
  * `body` - The content to be indexed  
  * `ignore` - Elements that can be ignored, e.g. headers, footers and menus, can optionally also be given a parameter  
* Field configuration  
  * `index-attrs` - attributes that are to be indexed
  * `weight` - Weighting of an element
  * `meta` - Additional metadata for a document, can include authors
      * `image` - metadata about images
      * `title` - The element for the title  
  * `filter` - Filter, can be used e.g. for tags

## External configuration

As the configuration is element-specific, it can be separated quite easily from the input document. The comparison to inline CSS above is not accidental, as CSS selectors are the means of choice for cleanly separating content and indexing (instructions) here too. All that is needed is a data structure that combines the two. And therein lies the novelty of the approach presented.

The basic structure is relatively simple: a list of CSS selectors can be assigned for each option above and parameters can then be specified depending on the type (see above).

This example illustrates the assignment:

```yaml
files:
  output: docs/index
  source: docs
  include:
    - '**/*.htm'
    - '**/*.html'
  exclude:
    - 'tags/**'
    - 'en/tags/**'
    - 'post/page/*/**'
    - 'en/post/page/*/**'
    - 'search/**'
    - 'en/search/**'
content:
  ignore:
    - "<meta http-equiv=\"refresh\" content=\"0; url="
index:
# Tagging attributes
  body:
    - .content-container
  ignore:
    - header.header
    - footer.footer: all
    - script: all
    - "div.menu": all
  weight:
    - "h1": 7.0
    - "h2": 6.0
    - "h3": 5.0
    - "a[data-wikidata-entity]": 5.0
    - "h4": 4.0
    - "h5": 3.0
    - "h6": 2.0
# Index fields
  meta:
    author: 'meta[name="author"]'
    wikidata:
      - "a[data-wikidata-entity]": "[data-wikidata-entity]"
    variants:
      - "a[data-wikidata-entity]":
          function: variants
          args:
            lang: "{lang}"
    title:
      - h1.post-title
      - ".section-head h1.section-head-title"
    date:
      - ".date time": "[datetime]"
    selector:
      - "p, h1, h2":
          function: generate_css_selector
    image:
      - ".gallery .gallery-image.caption": "[href]"
      - "figure img": "[src]"
  sort:
    date:
      - ".date time": "[datetime]"
  filter:
    tag:
      - ".meta .tags a":
          function: extract
          args:
            pattern: "s/#(.*)/$1/g"
    section:
      - body:
          function: extract
          args:
            attribute: "class"
            pattern: "s/.*section-(.[^ ]*).*/$1/g"

  index-attrs:
    a: "[data-wikidata-entity]"
```

In addition to the general functionality already explained, a few special features also become clear:

* General configuration of directories and patterns for including and excluding the files to be indexed
* Content-based filters for content, used here to exclude redirects
* Weightings are also assigned to elements with certain attributes  
* Additional functions - these enable documents to be enriched with additional data. Examples can be a generated CSS selector that only addresses the input element, or typing of entities

## Implementation

The example implementation uses the Python API from Pagefind, mainly because I already have experience with the Python library [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/), which is used for selection using CSS selectors.

<details>
  <summary>Gist</summary>
  {{< html/iframe-consent >}}
      {{<gist cmahnke 5049d42cd6dabc19cfd6c85161947fa2 >}}
  {{< /html/iframe-consent >}}
<details>

## Outlook

The separation of content to be indexed and the configuration of the index now allows a few simple extensions that could massively increase the (re-)usability of the software:

* **Inline callbacks for CSS selectors**
  If it is possible to execute functions or callbacks for elements found via CSS selectors, these could also further enrich the index. These callbacks could of course be exchanged, so simple preprocessing pipelines could be realised, as known from [ElasticSearch](https://www.elastic.co/docs/reference/enrich-processor/pipeline-processor), for example
**Multiple output documents for one input document**
  It is also conceivable to create several indexing documents for one input document. This has the advantage that individual document fragments can also be searched and addressed.

If the configuration were realised in JavaScript (instead of YAML or JSON), the callbacks / plugins could also be defined or imported directly inline.
