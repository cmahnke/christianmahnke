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
    - https://www.wikidata.org/wiki/Q281876
tags:
- SoftwareDevelopment
- Museum
- AI
- JavaScript
- AgenticCoding
lastmod: 2026-10-21T00:00:00+02:00
---

2027 ist das [Gauß-Jahr](https://www.uni-goettingen.de/de/3240.html?id=8224)...

<!--more-->

...und dafür soll es im [Forum Wissen](https://forum-wissen.de/) eine Medienstation geben, die den Weg von Carl Friedrich Gauß im Rahmen der [Gaußsche Landesaufnahme](https://de.wikipedia.org/wiki/Gau%C3%9Fsche_Landesaufnahme) nachzeichnet.

Die Wahl fiel auf [StoryMapJS](https://storymap.knightlab.com/), da diese Anwendung fast alle Anforderungen an die geplante Geschichte erfüllte. Allerdings gab es auch ein paar Lücken:
* Da aber die Medienstationen normalerweise relativ eingeschränkt sind, habe ich darauf verzichtet.
* Mehrere Kartenlayer (OpenStreetmap Basiskarte), zwei Layer historisches Kafrtenmaterial, einer davon mit TRansparenz.

Daher war dieses Projekt eine gute Gelegenheit einmal meine Ideen aus dem letzten Jahr über [Ki-gestützte Software Renovierung](/post/academic-software-publishing/) auszuprobieren. Und mit den massiven Fortschritten bei den kostengünstigen Modellen für Agentic Coding seit damals waren auch einige Verbesserungen möglich.

**Das Projekt wurde mit [OpenCode](https://opencode.ai/) und [GLM 5.3 Flash](https://huggingface.co/zai-org/GLM-5.3-Flash) durchgeführt.**

## Schritte

Die ersten Schritte bestanden darin die grundlegende Infrastruktur auf einen aktuellen Stand zu heben. Dafür wurden einige moderne Best Practises eingeführt:
* TypeScript statt JavaScript
* Keine Geheimnisse im Repository, kein Tracking
* Jeweils moderne Standards, keine Workarounds für abgekündigte Software

### Der Anfang

Erstmal die Reduktion der Oberfläche (wir brauchen nur den Viewer) sowie Modernisierung der Infrastruktur

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
* Remove Google Tag Manager
* After each step, commit to the working Git branch.
```
{{< /details >}}

Darauf aufbauend, können einige Schritte weiter ausgefeilt werden:

{{< details summary="Prompt" >}}
```
Since we now have modern structures for validation and linting, we should use them:
* Add prettier and run it
* Make sure there are no disabled Stylelint rules, fix all resulting errors
* Make sure all functions have the right Type annotations
* Remove unnecessary (that aren't passed around) const definitions for functions (use normal definitions instead), it's bad style!
* Check if there are vendor functionalities that should be replaced with external dependencies from NPM. Make sure they are maintained (updated in the last two years), and that Typescript types are available, if not, consider alternatives.
  * Check: https://github.com/rodrigopolo/minEmoji
  * Check: https://github.com/ded/morpheus.
* Make sure JavaScript 2022 features are used where possible, remove polyfills for which native support existed in 2022.
  * Check if there are modern approaches to the classMixin things (look at https://www.typescriptlang.org/docs/handbook/mixins.html), if so, use them!
  * Try to remove things from the global window scope, if possible!
* Make sure to replace SASS '@import' to '@use' to avoid SASS warnings, make sure that import order changes result in the same output stylesheets like before.
* Check if there are references to external images, icons, etc. for the UI (including TS code and SCSS) and add them to this repository (if the licence permits), don't check the examples!
* Remove deprecated code (like meant for older versions).
* Review the code for obvious bugs and fix them.

* Remove vendor specific CSS property manipulation from src/Dom/Dom.ts.
* Check if browser detection logic in src/core/Browser.ts is still needed, if not, remove the unneeded parts.
* Add a fullscreen button, make it configurable via options.
* Remove all IIFE constructs (also ), if possible
* Provide a minified build
* Remove all media type sources that don't work anymore, use the examples to test, add a placeholder containing the original URL to the fixed examples.
* Show a vertical scroll bar on desktop if the slide content overflows. If the device is touch enabled, make it wider and style it matching the rest of the application.
```
{{< /details >}}


{{< details summary="Prompt" >}}
```


```
{{< /details >}}

## Nacharbeiten

Grundsätzlich war es nach diesen Schritten aber nicht getan. Sie waren vielmehr eine Vorbereitung für weitere, eher kleinteilige Schritte, die sich daher nicht wirklich als kompakte Prompts ausdrücken lassen. Diese reichten von visuellen (UI) Fehlerbehebungen über kleinere bis mittlere Verbesserungen der Linien-Animation bis zur Demo-Seite (inklusive der Verbesserung der Dokumentation). Dazu kamen größere Verbesserungen, so hat der Agent alle einfachen bis mittleren Bugs und Verbesserungen aus dem [Bugtracker](https://github.com/NUKnightLab/StoryMapJS/issues) behoben bzw. implementiert, falls sie noch aktuell waren.

## Offene Punkte

Zwei Features sind bisher offen geblieben, da der Bedarf dafür bisher nicht gegeben war:
* Ein IIIF-Dialekt als internes Format
* Die Verlagerung der Karten-Marker in OpenLayers (als Layer?). Dies würde es beispielsweise erlauben, das Clustering von OpenLayers zu verwenden.

## Ergebnis:

* Der renovierte Code ist nun auf GitHub verfügbar.
* Viele der offenen [Probleme der Originalimplementierung](https://github.com/NUKnightLab/StoryMapJS/issues) konnten behoben werden.
* Es existiert eine [Demo-Seite](https://cmahnke.github.io/StoryMapJS/).
* Zusätzlich kann der Code über [NPM bezogen werden](https://www.npmjs.com/package/@projektemacher/storymapjs).

## Lessons Learned

Insgesamt gibt es auch Erkenntnisse, die sich sicher auch auf andere Projekte dieser Art übertragen lassen:
* Ab einem gewissen Projekt-Umfang ist es unrealistisch, auch nur mit manuellen Tests an der Benutzeroberfläche hinterherzukommen!
  * Daher muss das automatisiert werden, aber Vorsicht, gerade beim Layout (bzw. alles, was mit CSS zu tun hat), sind LLMs derzeit recht schlampig. Es gibt sogar noch welche, die nicht mal "sehen" können!
* Strukturelle Entscheidungen sollten dokumentiert sein, damit der Agent nicht häufiger gleiche oder ähnliche Entscheidungen abfragt (besonders, wenn der Kontext voll läuft).
* Wenn man die jeweilige Problemstellung gut (strukturell) eingrenzen kann, lassen sich auch mehrere Agenten auf einer Code-Basis einsetzen.

# Update 7.10.26

Inzwischen ist die Version 0.11.0 [veröffentlicht](https://www.npmjs.com/package/@projektemacher/storymapjs).

# Update 21.10.26

In den letzten Tagen habe ich ein weiteres Renovierungsprojekt gestartet: meine eigenen Blogprojekte. Durch verschiedene Hugo-Updates sind in den letzten Jahren große Mengen an technischen Schulden aufgelaufen, die langsam mal beseitigt werden wollten. Dabei sind auch deutliche Beschränkungen für solche Renovierungsprojekte aufgefallen: Während sich der Code oben in der Regel einfach durch Interpreter und Tests validieren ließ, sind strukturierte Daten wie z. B. YAML eine völlig andere Problemklasse (wobei das Problem in diesem Fall auch noch durch die Hugo-Frontmatter-Struktur begünstigt wurde: Es gibt keinen Validator). Am Ende war es einfacher, die KI zu benutzen, um Migrationsskripte zu schreiben, als sie es selbst machen lassen.
