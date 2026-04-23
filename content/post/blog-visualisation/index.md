---
date: 2026-04-21T15:49:44+02:00
title: "Blog Metadaten visualisiert"
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
Vor etwa einem Jahr habe ich schon einmal versucht, die [Bloginhalte in einer Visualisierung darzustellen](/post/tag-pairs/)...
<!--more-->

...aber das war eher ein Fehlschlag.

Nun habe ich einen neuen Versuch gewagt. Diesmal habe ich den [Triple Store aus dem letzten Beitrag verwendet](/post/blog-sparql/) verwendet und das Ergebnis kann sich durchaus sehen lassen.

**Es kann etwas dauern, bis der Graph geladen und berechnet wurde.**

{{< graph-viz src="/meta/wikidata/enriched_entities.hdt" languages="mul,de,en" >}}

Enhält Daten von [Wikidata](https://www.wikidata.org/)., lizensiert unter [CC0](https://www.wikidata.org/wiki/Wikidata:Text_of_the_Creative_Commons_Public_Domain_Dedication).
{.wikidata-attribution}

Für Mobilgeräte als [PDF-Download](./graph.pdf), die Datei wird nicht aktualisiert, wenn neu Beiträge hinzukommen.

## Erläuterungen

* Die roten Rechtecke repräsentieren die einzelnen Blogbeiträge.
* Die gelben Rauten repräsentieren Schlagworte des Blogs.
* Blaue Kreise sind Entitäten von Wikidata (die auch als Schlagworte dienen).
* Grüne Kreise stellen Entitäten der Seite dar (z. B. Linked Art oder andere Metadateneinträge).

Einige Objekte haben eingefärbte Rahmen, diese zeigen den Typ an. Derzeit sind abernur ein paar Typen konfiguriert.

### Vorauswahl

Die folgende Abfrage wird genutzt um die Daten für den Graphen oben zu visualisieren:

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

## Umsetzung

Neben der Kombination aus HDT und OxiGraph aus dem letzten Post, kommt für die Visualisierung [Cytoscape](https://js.cytoscape.org/) zum Einsatz. Der PDF Export wurde mit [`cytoscape-svg`](https://github.com/kinimesi/cytoscape-svg) erstellt.

# Warum?

Sicher, der Graph ist schön anzusehen, aber er hat auch noch andere Vorteile:
* Er erlaub die Navigation aus dem Silo dieses Blogs heraus.
* Die äußeren Ringe zur Klassifikation erlauben einbicke in die Hierachie der Objektbeziehungen ("ist ein"). So ist die [Künstlerkolonie Dötlingen (Q1797167)](http://www.wikidata.org/entity/Q1797167) weder ein Ort, noch eine Gruppe, noch eine Organisation.
* Er kann der Qualitätskontrolle der Verschlagwortung dienen, so fällt z.B. auf, dass [`libjxl` (Q99738405)](https://www.wikidata.org/wiki/Q99738405),also die Implementierung, und [JPEG XL (Q72885392)](https://www.wikidata.org/wiki/Q72885392), also dsa Dateiformat, bisher inkonsistent vergeben sind.


## Ausblick

Einige Verbesserungen sind noch denkbar:
* Die Visualisierung der Basisklassen (z.B. Personen, Orte, Organisationen, Software) ist noch nicht ganz vollständig.
* Die thematische Nähe der Knoten könnte noch für das Layout des Graphen genutzt werden.
* Grundsätzlich kann das Layout noch verbessert werden.
* Cytoscape bietet ästhetisch sehr ansprechende Darstellungen, die schöner sind als die oben gezeigte.

## Update 22.4.2026

Wie von [Konrad Höffner vorgeschlagen](https://github.com/KonradHoeffner/hdt/issues/107#issuecomment-4295799504) gibt es nun einen Vollbild Modus und Cytoscape nutzt nun [WebGL](https://de.wikipedia.org/wiki/WebGL).