---
date: 2026-04-15T10:39:44+02:00
title: "Blog Metadaten über SPARQL abfragen"
draft: true
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

Seit Anfang 2025 erfasse ich zusätzliche Metadaten für die Beiträge in diesem Blog.
<!--more-->
Die Anregung dazu kam von [Frank Reichert](https://www.vermessungs-bibliothek.de/) via Mastodon als Kommentar zu dem Beitrag [Archive: Bestandsaufbau durch Bürgerbeteiligung fördern](/post/archives-citizen-participation/).

Dazu habe ich zu Beginn des Jahres weitere [JSON-LD](https://de.wikipedia.org/wiki/JSON-LD)-basierte Metadatenformate wie [Codemeta](https://codemeta.github.io/) und [Linked Art](https://linked.art/) für einige Beiträge hinzugefügt und die [Schema.org](https://schema.org/) verbessert.

{{< details summary="Ausgangsdaten" >}}
Für die Erfassung der notwendigen Triplets wird nur diese Schema.org [Ausgangsdatei](/meta/schema.org/index.json) genutzt. Daraus werden alle notwendigen Daten und ihre -quellen gezogen:
* Wikidata Q-IDs
* **Linked Art**, siehe [Linked Art Metadaten](/post/linkedart-metadata/)
* **CodeMeta**, siehe [Metadaten für Software](/post/software-metadata/)
{{< /details >}}

Auch wenn es weiterhin keine "tollen" Anwendungen gibt, können nun über diese Daten [SPARQL](https://de.wikipedia.org/wiki/SPARQL)-Abfragen ausgeführt werden. Damit es nicht langweilig wird, sind dabei einige Daten aus Wikidata Teil des Corpus.

Für die Erstellung werden die Schema.org-Daten des Blogs als Ausgangsbasis genommen und die Linked-Art- und Code-Meta-Einträge hinzugezogen. Der entstandene Graph wird dann mit Daten aus Wikidata angereichert und in das [HDT-Format](https://en.wikipedia.org/wiki/HDT_(data_format)) überführt.

Dieser Weg ist notwendig, da die Anzahl der Entitäten, besonders seit Anfang dieses Jahres, massiv gestiegen ist: Ursprünglich wurden nur die Tags auf die jeweiligen Wikidata-Entitäten abgebildet, nun existiert jedoch ein Script, das sie semiautomatisch aus den jeweiligen Texten extrapoliiert. Dafür kommt ein Python-Skript auf Basis von SpaCy zum Einsatz.
Aufgrund des Rate-Limits kommt es bei der Ausführung via SPARQL aus Wikidata recht schnell zu Fehlermeldungen. Andererseits resultiert das Serialisieren der Daten in einem JSON-LD-Graph in einer umfangreichen Datei.

{{< client-sparql src="/meta/wikidata/enriched_entities.hdt" >}}

## Beispiele:

* Blog-Posts, in denen es um Künstler geht, die im 19. Jahrhundert geboren wurden, diese Abfrage macht nochmehr, aber die Daten sind noch nicht vorhanden.
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
    FILTER(LANG(?occLabel) = "de")
  }

  ?artist wdt:P569 ?birthDate .
  FILTER(year(xsd:dateTime(str(?birthDate))) < 1900)
}
GROUP BY ?blogPost ?artist ?artistLabel ?birthDate
ORDER BY ?birthDate
```

* Die Koordinaten der Orte, die in Blogbeiträgen mit den Schlagwörtern "Museum" und "Ausstellung" vorkommen.
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
    FILTER(LANG(?placeLabel) = "de")
  }
}
```

* Abfrage nach Artikeln, die dem Term (Schlagwort) "Holzschnitt" aus dem [Getty ATT Thesaurus](https://de.wikipedia.org/wiki/Art_and_Architecture_Thesaurus) (`http://vocab.getty.edu/aat/300041405`) entsprechen.
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


