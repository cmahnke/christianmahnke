---
date: 2026-04-19T19:39:44+02:00
title: "Blog Metadaten visualisiert"
tags:
  - Wikidata
  - LOD
  - SPARQL
  - Visualisation
  - Website
draft: true
wikidata:
  - https://www.wikidata.org/wiki/Q3539533
  - https://www.wikidata.org/wiki/Q115616582
  - https://www.wikidata.org/wiki/Q3475322
  - https://www.wikidata.org/wiki/Q118980507
  - https://www.wikidata.org/wiki/Q116963652
---
About a year ago, I tried [visualising the blog content](/en/post/tag-pairs/)...<!--more-->

...but that was more of a failure.

Now I’ve given it another go. This time I’ve used the [Triple Store from the last post](/en/post/blog-sparql/) and the result is certainly impressive:

{{< graph-viz src="/meta/wikidata/enriched_entities.hdt" languages="mul,en,de" >}}

Contains data from [Wikidata](https://www.wikidata.org/), licensed under [CC0](https://www.wikidata.org/wiki/Wikidata:Text_of_the_Creative_Commons_Public_Domain_Dedication).
{.wikidata-attribution}

For mobile devices, available as a [PDF download](./graph.pdf); the file is not updated when new posts are added.

## Explanations

* The red rectangles represent the individual blog posts.
* The yellow diamonds represent blog tags.
* Blue circles are Wikidata entities (which also serve as tags).
* Green circles represent entities on the page (e.g. linked articles or other metadata entries).

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

## Further improvements

A few improvements are still possible:
* The base classes (e.g. people, places, organisations, software) could be visualised in a simpler way.
* The thematic proximity of the nodes could be utilised in the layout of the graph.
* Generally speaking, the layout could still be improved.
* Cytoscape offers visually appealing visualisations that are more attractive than the one shown above.