---
date: 2026-04-17T22:39:44+02:00
title: "Querying blog metadata via SPARQL"
tags:
  - Wikidata
  - LOD
  - SPARQL
  - Python
wikidata:
  - https://www.wikidata.org/wiki/Q3539533
  - https://www.wikidata.org/wiki/Q115616582
  - https://www.wikidata.org/wiki/Q3475322
  - https://www.wikidata.org/wiki/Q118980507
---

Since the start of 2025, I have been recording additional metadata for the posts on this blog.
<!--more-->
The suggestion came from [Frank Reichert](https://www.vermessungs-bibliothek.de/) via Mastodon as a comment on the post [Archives: Fostering collection development through citizen participation](/en/post/archives-citizen-participation/).

To this end, at the start of the year I added further [JSON-LD](https://en.wikipedia.org/wiki/JSON-LD)-based metadata formats such as [Codemeta](https://codemeta.github.io/) and [Linked Art](https://linked.art/) for some posts and improved the [Schema.org] (https://schema.org/).

{{< details summary="Source data" >}}
Only this Schema.org [source file](/meta/schema.org/index.json) is used to capture the necessary triplets. All necessary data and their sources are extracted from this:
* Wikidata Q-IDs
* **Linked Art**, see [Linked Art metadata](/en/post/linkedart-metadata/)
* **CodeMeta**, see [Metadata for software](/en/post/software-metadata/)
{{< /details >}}

Even though there are still no "great" applications, [SPARQL](https://de.wikipedia.org/wiki/SPARQL) queries can now be run on this data. To keep things interesting, some data from Wikidata has been included in the corpus.

To create this, the blog's Schema.org data is used as a starting point, with LinkedArt and CodeMeta entries incorporated. The resulting graph is then enriched with data from Wikidata and converted into the [HDT format](https://en.wikipedia.org/wiki/HDT_(data_format)).

This approach is necessary because the number of entities has risen massively, particularly since the start of this year: originally, only the tags were mapped to the respective Wikidata entities, but now there is a script that extracts them semi-automatically from the respective texts. A Python script based on SpaCy is used for this purpose.
Due to the rate limit, executing queries via SPARQL from Wikidata very quickly results in error messages. On the other hand, serialising the data into a JSON-LD graph results in a large file.

## Query

{{< client-sparql src="/meta/wikidata/enriched_entities.hdt" >}}

## Examples

* Blog posts about artists born in the 19th century; this query returns even more results, but the data isn"t available yet.
```sparql
PREFIX schema: <http://schema.org/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?blogPost ?artist ?artistLabel 
       (GROUP_CONCAT(DISTINCT ?occLabel; separator=", ") AS ?occupations)
       ?birthDate
WHERE {
  ?blogPost a schema:BlogPosting ;
            schema:about ?artist .

  ?artist wdt:P106 ?directOccupation .

  ?directOccupation wdt:P279* ?occupation .
  VALUES ?occupation {
    wd:Q483507   # Künstler
    wd:Q1028181  # Maler
    wd:Q1281618  # Bildhauer
    wd:Q42973    # Architekt
    wd:Q15296    # Schriftsteller
  }

  OPTIONAL {
    ?artist rdfs:label ?artistLabel .
    FILTER(LANG(?artistLabel) = "de")
  }
  OPTIONAL {
    ?directOccupation rdfs:label ?occLabel .
    FILTER(LANG(?occLabel) = "en")
  }

  ?artist wdt:P569 ?birthDate .
  FILTER(year(xsd:dateTime(str(?birthDate))) < 1900)
}
GROUP BY ?blogPost ?artist ?artistLabel ?birthDate
ORDER BY ?birthDate
```

* The coordinates of the locations mentioned in blog posts containing the keywords "museum" and "exhibition".
```sparql
PREFIX schema: <http://schema.org/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?blogPost ?place ?placeLabel ?coordinates
WHERE {
  ?blogPost a schema:BlogPosting ;
            schema:about ?place .

  ?place wdt:P31/wdt:P279* ?type .
  VALUES ?type { wd:Q33506 wd:Q464980 }

  ?place wdt:P625 ?coordinates .

  OPTIONAL {
    ?place rdfs:label ?placeLabel .
    FILTER(LANG(?placeLabel) = "en")
  }
}
```

* Search for articles matching the term (keyword) "woodcut" from the [Getty ATT Thesaurus](https://de.wikipedia.org/wiki/Art_and_Architecture_Thesaurus) (`http://vocab.getty.edu/aat/300041405`).
```sparql
PREFIX schema: <http://schema.org/>
PREFIX aat: <http://vocab.getty.edu/aat/>
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?article ?object ?technique ?techniqueLabel
WHERE {
  ?article a schema:BlogPosting ; 
           schema:about ?object .

  ?object a crm:E22_Human-Made_Object ;
          crm:P108i_was_produced_by ?production .

  ?production crm:P32_used_general_technique ?technique .

  VALUES ?technique { aat:300041405 }

  ?technique rdfs:label ?techniqueLabel .
}
```


## Potential issues

During implementation, I noticed a few minor issues with Chrome: after reloading the page several times, memory errors occurred – presumably the browser is not clearing a tab’s memory properly or is caching more than necessary. In this case, an error message (e.g. `memory access out of bounds`) appears in the status bar and the browser needs to be restarted.

## Implementation

The HDT file created in the first step is loaded using the [WASM](https://en.wikipedia.org/wiki/WebAssembly) variant of the [Rust](https://en.wikipedia.org/wiki/Rust_(programming_language)) library [HDT](https://github.com/KonradHoeffner/hdt). The contents are then converted in memory so that they can be used in [OxiGraph](https://github.com/oxigraph/oxigraph) (also compiled from Rust to Wasm). Strictly speaking, OxiGraph is not actually necessary at this stage, as HDT can also execute SPARQL queries. However, OxiGraph has the advantage of being able to execute distributed SPARQL queries as well.

Translated with DeepL.com (free version)