---
date: 2026-01-11T13:22:44+02:00
title: "Linked Art Metadaten"
keywords: Linked Art, Linked Data, Kunst, 
cite: true
tags:
  - Metadata
  - LOD
  - JSON
  - Art
wikidata:
  - https://www.wikidata.org/wiki/Q115616582
  - https://www.wikidata.org/wiki/Q6108942
  - https://www.wikidata.org/wiki/Q1249973
  - https://www.wikidata.org/wiki/Q624005
---

Zur Vorbereitung zukünftiger Experimente gibt es nun für einige Einträge Linked-Art-Metadaten...
<!--more-->

...zumindest zu Beiträgen in denen es um [Kunstwerke](https://christianmahnke.de/tags/Art/) geht. 

[Linked Art](https://linked.art/) ist ein Metadaten-Standard, der speziell für die Beschreibung von kulturellen Objekten und deren Provenienz (also Geschichte) entwickelt wurde. Er basiert auf dem [CIDOC-CRM](https://cidoc-crm.org/) Datenmodell und nutzt [JSON-LD](https://de.wikipedia.org/wiki/JSON-LD), um Informationen über Kunstwerke, Künstler und Provenienzen web-basiert und maschinenlesbar austausche zu können. Damit ist es z.B. mit [LIDO](https://de.wikipedia.org/wiki/Lightweight_Information_Describing_Objects) verwandt.

Beispiele für einzelne Posts / Seiten:

* [Flamingo von Fritz Neumann](/collections/donations/spandau/linkedart.json)
  * [Auch im IIIF Manifest referenziert](/collections/donations/spandau/manifest.json)
* [Kinder von Elsa Haensgen-Dingkuhn](/post/print-elsa-haensgen-dingkuhn/linkedart.json)
* [Boltenhagen von Tadeusz Kaczmarek](/post/painting-kaczmarek-tadeusz/linkedart.json)
* ["Alte Steintreppe vor bäuerlichem Gehöft" von François Poggi](https://christianmahnke.de/post/painting-francois-poggi/linkedart.json)

Die jeweiligen JSON-LD Datein sind jeweils im HTML Header referenziert:
```html
<link rel="describedby" href="https://christianmahnke.de/post/painting-kaczmarek-tadeusz/linkedart.json" type="application/ld+json;profile='https://linked.art/ns/v1/linked-art.json'"/>
```

## Kann man schon was sehen?

Auf Anwendngen für Endnutzer muss man derzeit leider noch warten, bis es z.B. eine Browsererweiterung zur Anzeige gibt. Allerdings wird der Haupnutzen sicher im Hintergrund sein, also z.B. Vernatzung von sammlungen und Sammlungsobjeten oder die Dartellung von zusätzlichen Informationen auf einer Webseite...