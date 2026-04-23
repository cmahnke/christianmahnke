---
date: 2026-04-21T15:49:44+02:00
title: "Blog metadata visualised"
tags:
  - Wikidata
  - LOD
  - SPARQL
  - Visualisation
  - Website
preview: preview.jpg
cite: true
wikidata:
  - https://www.wikidata.org/wiki/Q3539533
  - https://www.wikidata.org/wiki/Q115616582
  - https://www.wikidata.org/wiki/Q3475322
  - https://www.wikidata.org/wiki/Q118980507
  - https://www.wikidata.org/wiki/Q116963652
  - https://www.wikidata.org/wiki/Q375913
  - https://www.wikidata.org/wiki/Q139274681
---
About a year ago, I tried [visualising the blog content](/en/post/tag-pairs/)...<!--more-->

...but that was more of a failure.

Now I’ve given it another go. This time I’ve used the [Triple Store from the last post](/en/post/blog-sparql/) and the result is certainly impressive:

**It may take a moment for the graph to load and calculate.**

{{< graph-viz src="/meta/wikidata/enriched_entities.hdt" languages="mul,en,de" >}}

Contains data from [Wikidata](https://www.wikidata.org/), licensed under [CC0](https://www.wikidata.org/wiki/Wikidata:Text_of_the_Creative_Commons_Public_Domain_Dedication).
{.wikidata-attribution}

For mobile devices, available as a [PDF download](./graph.pdf); the file is not updated when new posts are added.

## Explanations

* The red rectangles represent the individual blog posts.
* The yellow diamonds represent blog tags.
* Blue circles are Wikidata entities (which also serve as tags).
* Green circles represent entities on the page (e.g. linked articles or other metadata entries).

Some objects have coloured borders, which indicate the type. However, only a few types are currently configured.

### Pre-selection

The following query is used to visualise the data for the graph above:

```sparql
PREFIX schema: <http://schema.org/>
SELECT ?s ?p ?o ?isTagged WHERE {
  <https://christianmahnke.de/post/> schema:blogPost ?post .
  ?post ?p ?o .
  BIND(?post AS ?s)
  FILTER(?p NOT IN (
    schema:author,
    schema:url,
    schema:workTranslation,
    <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
  ))
  FILTER(?o NOT IN (
    schema:BlogPosting
  ))
  OPTIONAL {
    ?post schema:identifier ?ident .
    ?ident a schema:PropertyValue ;
            schema:propertyID "projektemacher" ;
            schema:value "tag" .
    BIND(true AS ?isTagged)
  }
}
```

# Implementation

In addition to the combination of HDT and OxiGraph mentioned in the last post, [Cytoscape](https://js.cytoscape.org/) is used for visualisation. The PDF export was created using [`cytoscape-svg`](https://github.com/kinimesi/cytoscape-svg).

# Why?

Sure, the graph looks nice, but it also has other advantages:
* It allows navigation outside the confines of this blog.
* The outer rings used for classification provide insight into the hierarchy of object relationships ("is a"). For example, the [Dötlingen Artists’ Colony (Q1797167)](http://www.wikidata.org/entity/Q1797167) is neither a place, nor a group, nor an organisation.
* It can help with quality control of tagging; for example, it highlights that [`libjxl` (Q99738405)](https://www.wikidata.org/wiki/Q99738405), i.e. the implementation, and [JPEG XL (Q72885392)](https://www.wikidata.org/wiki/Q72885392), i.e. the file format, have so far been assigned inconsistently.

## Further improvements

There is still room for improvement:
* The visualisation of the base classes (e.g. people, places, organisations, software) is not yet complete.
* The thematic proximity of the nodes could be utilised further in the graph layout.
* In general, the layout could be improved.
* Cytoscape offers visually appealing visualisations that are more attractive than the one shown above.

## Update 22 April 2026

As [suggested by Konrad Höffner](https://github.com/KonradHoeffner/hdt/issues/107#issuecomment-4295799504), there is now a full-screen mode and Cytoscape now uses [WebGL](https://en.wikipedia.org/wiki/WebGL).