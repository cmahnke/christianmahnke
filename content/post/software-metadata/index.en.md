---
date: 2025-02-25T19:52:22+02:00
title: 'Metadaten für Software'
description: "Software-Metadaten für die (automatische) Nachnutzung von Funktionionalitäten"
cite: true
tags:
- SoftwareDevelopment
- Metadata
- ProjectIdea
- KI
wikidata:
  - https://www.wikidata.org/wiki/Q5205836
  - https://www.wikidata.org/wiki/Q1142726
---

Part 2 on software metadata.

<!--more-->

While the [first part](/post/hugo-cff-codemeta/) dealt with the integration of metadata into software projects, this part will now highlight possible advantages and perspectives. This time, the focus will not be on the visibility of the authors (through citation), but on the visibility of the respective product or code and its reuse.

About a year ago, I published a post about my [experiences](/post/academic-software-publishing) with integrating software artefacts into my own environment. While I limited myself to technical challenges such as scalability, portability, etc. at the time, that was not all. At the time described, it was also about machine-readable metadata. At that time, [DAOP](https://en.wikipedia.org/wiki/DOAP) was "modern" (and still is in some communities today).

To date, however, there is no search engine that aggregates projects from code platforms of different sizes, for example, and enables a faceted search via the respective metadata in order to find a targeted implementation for a specialised problem.

## But what could you do with it if it were different?

And if you have such metadata, you can of course index it and search for it. The latter can be thought of as similar to the keyword search on GitHub. It would be a great advantage if GitLab (both centralised and separate instances), Codeberg, Gitea and other comparable platforms and tools provided corresponding data for indexing.

It gets even more exciting when you can get agents to assemble components based on metadata. 
A constructed example, based on a previous [post](/post/vintagereality-ai/), would be the following:
* You instruct an agent to search for stereograms from a museum's digital collection. These would, of course, need to be identifiable as such, and metadata such as in this [post](/post/linkedart-metadata/) can help (for example, by searching for: [http://vocab.getty.edu/aat/300127197](http://vocab.getty.edu/aat/300127197.json)).
* A segmentation method is to be found for this purpose. Ideally, the agent compares the metadata of the input set for the media type with that of possible implementations. These could be marked with [https://www.wikidata.org/wiki/Q35158](https://www.wikidata.org/wiki/Q35158) and [https://www.wikidata.org/wiki/Q56933] (https://www.wikidata.org/wiki/Q56933) to roughly compare the functionality (without relation to each other) with the requirements.
* The implementations found are applied to the material and the results are returned to the client.

In this case, "putting together" is more of a long-term goal; in the first step, agents would probably be used to compile training data.

However, standardised keywords and specific controlled vocabulary are still lacking. As the field is very dynamic, it will certainly end up being a mixture of both in order to be able to map more niche usage scenarios.