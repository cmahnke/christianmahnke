---
date: 2025-11-19T20:22:44+02:00
title: "Authority data for private collections (and small cultural institutions)"
cite: true
tags:
  - CulturalPolicy
  - Metadata
  - Data
  - Wikidata
---
Since the beginning of the year, I have been adding Wikidata for various functions on my blogs...
<!--more-->

Admittedly, you can't see much of it yet, as it only involves links (in a few places in connection with Wikipedia articles in different languages). But I hope it's only a matter of time before the applications become more obvious here...

# Wikidata as a authority data source for private collectors (and smaller cultural institutions)

[Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page), the central knowledge database of the [Wikimedia Foundation](https://wikimediafoundation.org/), has become an indispensable tool for large memory institutions in recent years. However, the use of Wikidata as a standard data source offers particular advantages for dedicated private collectors and smaller cultural institutions, such as local historical societies, private museums or archives.

## What is authority data and what are its advantages?

[Authority data / files](https://en.wikipedia.org/wiki/Authority_control) ensures that all information about a person, place, organisation, work, topic or, more generally, an entity is consistent and unambiguous. It solves two problems at once: different spellings, name variants and multiple entities with the same name on the one hand, and machine processing and linking on the other.
A good example is "Fritz Neumann" from the ["Ric - An unknown Artist" blog](https://ric-unknownartist.projektemacher.org/): When searching for his identity, it was clear that there was **one** Fritz Neumann, but it was not clear which one.

# The advantages of Wikidata for collectors and smaller institutions

## Infrastructure and maintenance costs

The biggest hurdles are usually staffing and budget. In addition, there are institutional restrictions; not everyone can simply contribute to the large authority files / data vocabularies.
* **No additional costs:** Wikidata is a free, open project. There are no licence or hosting fees.
* **No institutional barriers:** Anyone can contribute, regardless of institutional affiliation.
* **Collaborative maintenance:** The data is maintained by a global community (and in some cases also by large partners such as the [German National Library](https://gnd.network/Webs/gnd/DE/Projekte/Wikibase/projektGNDmeetsWikibase_node.html) or the [Getty Research Institute](https://www.openartdata.org/2025/10/dataset-getty-gpi-merged-with-wikidata.html)). Collectors or small institutions do not have to recreate or maintain all data themselves.
* **Scalability:** The database grows automatically with contributions from the entire global community, giving "smaller" players access to a virtually infinite number of references and identifiers.

## Presentation and discoverability

By linking the objects or persons in your own collection to the corresponding Wikidata elements, your collection becomes part of the global knowledge network.
* **Contextualisation:** Wikidata data can be used to enrich your own collection data with additional external information (e.g. biographical data and locations) without having to maintain it manually.
* **Multilingualism:** Wikidata is available in over 300 languages – in varying degrees, of course. This also allows links to other languages to be mapped.
* **Search engines and crawlers:** Search engines (such as Google) use structured data from Wikidata to display information in so-called "knowledge panels". Linked objects are thus much easier to find and appear more prominently in search results. In addition, they can support crawlers (e.g. for AI training). The latter can be both an advantage and a disadvantage.

## Interoperability and future-proofing

Wikidata also serves as a bridge between different national and international authority files systems.
* **Identifiers:** A Wikidata element (e.g. Q21014973 for the artist Malte Sartorius) often contains dozens of external identifiers (GND, VIAF,   LCNAF, etc.). For your collection, this means that you only need to store one Q number and you will automatically be connected to all relevant external databases.
* **Easy data transfer:** Wikidata can be queried via REST and SPARQL, for example. Using Wikidata facilitates the transfer of machine-readable metadata and can prepare you for participation in aggregated portals (such as Europeana). Provided, of course, that your tools support this.
* **Sustainability:** As a project of the Wikimedia Foundation (Wikipedia), Wikidata enjoys a high degree of stability and acceptance, making it a safe choice for long-term data strategy.

# Outlook
* In principle, the number of links to external systems will continue to increase in the future, gradually making further information (including, where applicable, information about the organisation's own objects) accessible. The process will take place on three levels: 1) More linked open data sources, 2) More digitally available or digitised objects. 3) Richer metadata on the objects (e.g. through crowdsourcing and AI-supported processes).
The objects are only the starting point, as other entities (persons, organisations, places, concepts/themes, etc.) will also be linked to them.
* It also follows that "official" holdings (from large libraries, museums and archives) are increasingly likely to match their own entities.

# Conclusion

For private collections and smaller cultural institutions, Wikidata offers a way to enrich their collections with minimal to moderate effort, link them to other objects, and thus place them in a global context. In addition, it is a cost-effective solution for normalising one's own data and thus promoting visibility and (data) exchange.

However, the specific implementation depends on the respective workflow, and the same applies to the presentation on the web, i.e. the presentation system. But here, the open source community offers additions for a variety of popular systems.

# Update 20 November 2025

This article was also linked by [Archivalia](https://archivalia.hypotheses.org/242502).
