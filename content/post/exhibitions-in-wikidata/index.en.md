---
date: 2026-02-21T07:30:00+02:00
title: Exhibitions in Wikidata
tags:
- Wikidata
- LOD
- Exhibition
- Metadata
- Zenodo
---

How can digital objects be linked to exhibitions?

<!--more-->

A few qday ago, I noticed a [Mastodon post](https://openbiblio.social/@awinkler/116087107946746465) by Alexander Winkler: With an almost uncommented screenshot, a solution was presented (perhaps even unintentionally?) to a problem that has been on my mind for quite some time.

The screenshot shows the Wikidata entry for ["Streuselkuchen im Wandel der Zeit"](https://www.wikidata.org/wiki/Q134475458). In other words, a concrete model of an exhibition in Wikidata.

## And what is interesting about that?

I have been looking (also professionally) for ways to link different objects with exhibitions for quite some time. For example, to link software publications with their digital exhibition exhibits and their context (e.g. creation and presentation context).

## Example

As an example, I have taken the exhibition ["Was zum Quant?!"](https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/) (What's a quantum?!), which was shown from 27 March to 5 October 2025 at the Forum Wissen Göttingen as part of Quantum Year 2025.

There is [documentation](https://www.wikidata.org/wiki/Wikidata:WikiProject_Exhibitions) for the necessary and possible fields.

These are the properties:

| Property | Value | Reference / URL |
| :--- | :--- | :--- |
| `Lde` (Label de) | `Was zum Quant?!` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `Len` (Label en) | `Was zum Quant?!` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `Dde` (Desc de) | `Sonderausstellung im Forum Wissen Göttingen (2025)` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P31` (is a) | `Q29023906` (Special exhibition) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P1476` (Title) | `de:"Was zum Quant?!"` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P276` (Place) | `Q112061919` (Forum Wissen) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P664` (Organiser) | `Q112061919` (Forum Wissen) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P580` (Begin) | `+2025-03-27T00:00:00Z/11` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P582` (End) | `+2025-10-05T00:00:00Z/11` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P921` (Topic) | `Q41625` (Quantum mechanics) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P856` (URL) | `https://www.forum-wissen.de/sonderausstellungen/was-zum-quant/` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P1640` (Curator) | `Q136992263` (Ramona Dölling) | |
| `P361` (Part of) | `Q132398295` (International Year of Quantum Science and Technology) | |
{.top}

These can also be expressed as [QuickStatements](https://www.wikidata.org/wiki/Help:QuickStatements/en) to automate creation. The dates in the table above are therefore also formatted for the tool.

This entry can be used, for example, in Zenodo. The digital exhibit "Quantenkosmos Göttingen" (Quantum Cosmos Göttingen) was created for the exhibition and is available on Zenodo. In the metadata, the corresponding Wikidata entry was entered under "Related" with the following values:
* **Releation**: `Is part of`
* **Identifier**: `https://www.wikidata.org/wiki/Q138337449`
* **Scheme**: `URL`
* **Resource type**: `Event`

{{< figure src="zenodo.png" title="Ansicht der Metadaten bei Zenodo" >}}

[View metadata on Zenodo](https://zenodo.org/records/18618940)

## Acknowledgements

Many thanks to Alexander Winkler for the inspiration!
