---
date: 2026-02-21T07:30:00+02:00
title: Ausstellungen in Wikidata
tags:
- Wikidata
- LOD
- Exhibition
- Metadata
- Zenodo
wikidata:
  - https://www.wikidata.org/wiki/Q138337449
  - https://www.wikidata.org/wiki/Q112061919
---

Wie lassen sich digitale Objekte mit Ausstellungen verknüpfen?

<!--more-->

Letztens fiel mir ein [Mastodon-Post](https://openbiblio.social/@awinkler/116087107946746465) von Alexander Winkler auf: Mit einem fast unkommentierten Screenshot wurde (vielleicht sogar unintendiert?) eine Lösung für ein Problem präsentiert, das mich schon länger beschäftigt.

Der Screenshot zeigt den Wikidata-Eintrag für ["Streuselkuchen im Wandel der Zeit"](https://www.wikidata.org/wiki/Q134475458). Also eine konkrete Modellierung einer Ausstellung in Wikidata.

## Und was ist daran interessant?

Ich suche (auch beruflich) schon länger nach Möglichkeiten, verschiedene Objekte mit Ausstellungen zu verknüpfen. Zum Beispiel, um Software-Publikationen mit ihren digitalen Ausstellungsexponaten und deren Rahmen (z. B. Entstehungs- und Präsentationskontext) zu verknüpfen.

## Beispiel

Als Beispiel habe dich die Ausstellung ["Was zum Quant?!"](https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/), die vom 27. März bis 5. Oktober 2025 im Rahmen des Quantenjahrs 2025 im Forum Wissen Göttingen gezeigt wurde, genommen.

Für die notwendigen und möglichen Felder existiert eine [Dokumentation](https://www.wikidata.org/wiki/Wikidata:WikiProject_Exhibitions).

Hier die Eigenschaften für [Q138337449](https://www.wikidata.org/wiki/Q138337449):

| Eigenschaft | Wert | Fundstelle / URL |
| :--- | :--- | :--- |
| `Lde` (Label de) | `Was zum Quant?!` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `Len` (Label en) | `Was zum Quant?!` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `Dde` (Desc de) | `Sonderausstellung im Forum Wissen Göttingen (2025)` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P31` (ist ein) | `Q29023906` (Sonderausstellung) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P1476` (Titel) | `de:"Was zum Quant?!"` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P276` (Ort) | `Q112061919` (Forum Wissen) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| ``P664` (Organisator) | `Q112061919` (Forum Wissen) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P580` (Beginn) | `+2025-03-27T00:00:00Z/11` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P582` (Ende) | `+2025-10-05T00:00:00Z/11` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P921` (Thema) | `Q944` (Quantenmechanik) | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P856` (URL) | `https://www.forum-wissen.de/sonderausstellungen/was-zum-quant/` | `https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/` |
| `P1640` (Kurator) | `Q136992263` (Ramona Dölling) | |
| `P361` (Teil von) | `Q132398295` (International Year of Quantum Science and Technology) | |
{.top}

Diese lassen sich auch als [QuickStatements](https://www.wikidata.org/wiki/Help:QuickStatements/de) ausdrücken, um das Anlegen zu automatisieren. Die Datumsangaben in der obigen Tabelle oben sind daher auch für das Werkzeug formatiert.

Mit diesem Eintrag kann beispielsweise in Zenodo gearbeitet werden. Für die Ausstellung wurde das digitale Exponat "Quantenkosmos Göttingen" erstellt, das auf Zenodo verfügbar ist. In den Metadaten wurde der entsprechende Wikidata-Eintrag unter "Related" mit den folgenden Werten eingetragen:
* **Releation**: `Is part of`
* **Identifier**: `https://www.wikidata.org/wiki/Q138337449`
* **Scheme**: `URL`
* **Resource type**: `Event`

{{< figure src="zenodo.png" title="Ansicht der Metadaten bei Zenodo" link="https://zenodo.org/records/18618940" target="_blank" >}}



## Dank

Vielen Dank an Alexander Winkler für die Inspiration!
