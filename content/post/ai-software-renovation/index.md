---
date: 2026-09-21T15:52:22+02:00
title: 'KI -Softwarerenovierung'
description: "StoryMapJS aktualisiert"
params:
  cite: true
  preview: gauss-screenshot.png
  wikidata:
    - https://www.wikidata.org/wiki/Q112061919
    - https://www.wikidata.org/wiki/Q29584754
    - https://www.wikidata.org/wiki/Q5246046
    - https://www.wikidata.org/wiki/Q126084602
    - https://www.wikidata.org/wiki/Q1496362
    - https://www.wikidata.org/wiki/Q6722
    - https://www.wikidata.org/wiki/Q140646955
tags:
- SoftwareDevelopment
- Museum
- AI
- JavaScript
- AgenticCoding
lastmod: 2026-10-07T00:00:00+02:00
---

2027 ist das [Gauß-Jahr](https://www.uni-goettingen.de/de/3240.html?id=8224)...

<!--more-->

...und dafür soll es im [Forum Wissen](https://forum-wissen.de/) eine Medienstation geben, die den Weg von Carl Friedrich Gauß im Rahmen der [Gaußsche Landesaufnahme](https://de.wikipedia.org/wiki/Gau%C3%9Fsche_Landesaufnahme) nachzeichnet.

Die Wahl fiel auf [StoryMapJS](https://storymap.knightlab.com/), da diese Anwendung fast alle Anforderungen an die geplante Geschichte erfüllte. Allerdings gab es auch ein paar Lücken:
* Da aber die Medienstationen normalerweise relativ eingeschränkt sind, habe ich darauf verzichtet.
* Mehrere Kartenlayer (OpenStreetmap Basiskarte), zwei Layer historisches Kafrtenmaterial, einer davon mit TRansparenz.

Daher war dieses Projekt eine gute Gelegenheit einmal meine Ideen aus dem letzten Jahr über [Ki-gestützte Software Renovierung](/post/academic-software-publishing/) auszuprobieren. Und mit den massiven Fortschritten bei den kostengünstigen Modellen für Agentic Coding seit damals waren auch einige Verbesserungen möglich.

## Schritte

Die ersten Schritte bestanden darin die grundlegende Infrastruktur auf einen aktuellen Stand zu heben. Dafür wurden einige moderne Best Practises eingeführt:
* TypeScript statt JavaScript
* Keine Geheimniosse im Repository, kein Traking
* Nach

### Der Anfang

{{< details summary="Prompt" >}}
```
We need to restructure and renovate this project!
* Ignore agents.md.
* At the start, create a Playwright test suite covering the examples completely. After the migration, validate if the new structured code is valid.
* Remove the backend infrastructure, only keep the viewer.
* Remove the staging and add GitHub Actions for linting and packaging.
  * Add a Dependabot config.
* Add Vite as preview and as a replacement for Webpack (don't build IIFE or other outdated package formats like UMD, AMD).
* The new structure should follow a default Vite project.
* Migrate the tests to Playwright (robot_tests) and Vitest.
* Add ESLint and Stylelint.
* Convert JavaScript to TypeScript (V6), make sure everything works with updated dependencies (use `ncu`), no Common JS allowed!
* The target of TypeScript should be at least ESM 2022.
* Remove code for browsers from before 2022.
* Replace Leaflet with OpenLayers.
  * Make sure you get the line connecting the markers right. Animate the color change with the animation (when the transition is half way thru, half of the line is colored), make sure that the line animation runs backwards (retracts) when the back button is used.
* Replace Zoomify with IIIF Image API (use OpenLayers for display), integrate OpenLayers Zoomify support for backwards compatibility, but don't document or advertise.
* Convert Less to SASS (use SASS only, not postcss-scss), replace vendor specific properties. Make sure to replace SASS '@import' to '@use' and fix other SASS warnings.
* All fonts should be fetched from NPM and embedded using SCSS (with @font-source-utils/scss).
* Create a JSON schema and a validation script for storymap.json, check also on load, report all errors to the JavaScript console.
* Remove all compiled stuff from the repo (compiled/), also AWS_HOSTING, GITHUB_HOSTING and BEST_PRACTICES.
* After each step, commit to the working Git branch.
```
{{< /details >}}

{{< details summary="Prompt" >}}
```

```
{{< /details >}}


{{< details summary="Prompt" >}}
```


```
{{< /details >}}

## Nacharbeiten

Grundsätzlich war es aber nach diesen Schritten nicht getan, sie waren vielmehr eine Vorbereitung für weitere Schritte, die eher kleinteilig waren und sich daher nicht wirklich als Prompt ausdrücken lassen.


## Offene Punkte

Zwei Features sind bisher offen geblieben, da der Bedarf dafür bisher nicht gegeben war:
* Ein IIIF-Dialekt als internes Format
* Die Verlagerung der Karten-Marker in OpenLayers (als Layer) – dies würde es z.B. erlauben, das Clustering von OpenLayers zu verwenden.

## Ergebnis

* Der renovierte Code ist nun auf [GitHub verfügbar](https://github.com/cmahnke/StoryMapJS)
* Es existiert eine [Demo-Seite](https://cmahnke.github.io/StoryMapJS/)
* Zusätzlich kann der Code von [NPM bezogen werden](https://www.npmjs.com/package/@projektemacher/storymapjs)

## Lessons learned

Imnsgesamt gibt es auch ERkenntnisse, die sich sicher auch auf andere Projekte dieser Art übertragen lassen.
* Aber einem gewissen Projekt-Umfang ist es unrealistisch auch nur mit manuellen Tests an der Benutzeroberfläche hinterherzukommen
  * Daher muss das automatisiert werden, aber vorsciht, gerade beim Layout (bzw. alles was mit CSS zu tun hat), sind LLMs derzeit recht schlampig. Es gibt sogar noch welche, die nicht mal sehen können
*

# Update 7.10.26

Inzwischen ist die Version 0.11.0 veröffendlicht
