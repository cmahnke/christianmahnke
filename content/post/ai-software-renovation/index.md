---
date: 2026-09-21T15:52:22+02:00
title: 'KI-Softwarerenovierung'
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
* Und viele mehr - siehe Prompts

Auf Aktionen die eher kontrovers sein könnten ("Opinionated") wie spezifische Frameworks wie React oder Lit (Webcomponents) wurde explizit verzichtet.

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
* Remove outdated font formats (SVG, EOT).
* Create a JSON schema and a validation script for storymap.json, check also on load, report all errors to the JavaScript console.
* Remove all compiled stuff from the repo (compiled/), also AWS_HOSTING, GITHUB_HOSTING and BEST_PRACTICES.
* After each step, commit to the working Git branch.
* Remove examples with unclear copyright issues or known IPs (like Game of Thrones or Iron Maiden).
* Add an important note to the README that this is an unofficial/unapproved fork of the original repo. This is a proof of concept for an AI based renovation using the Model GLM 5.3 Flash.

After each step, commit to the working Git branch. Use subagents
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
* Remove Google Tag Manager
* Remove vendor specific CSS property manipulation from src/Dom/Dom.ts.
* Check if browser detection logic in src/core/Browser.ts is still needed, if not, remove the unneeded parts.
* Add a fullscreen button, make it configurable via options.
* Remove all IIFE constructs (also ), if possible
* Provide a minified build
* Remove all media type sources that don't work anymore, use the examples to test, add a placeholder containing the original URL to the fixed examples.
* Show a vertical scroll bar on desktop if the slide content overflows. If the device is touch enabled, make it wider and style it matching the rest of the application.
* Replace CSS filters containing "progid:DXImageTransform." and other outdated proprietary stuff with the real thing, remove all compatibility hacks for specific browsers
* Remove code only for browsers before 2022 from core/Load.
* Check the codebase for callbacks that could be replaced with promises, async, await:

After each step, commit to the working Git branch. Use subagents
```
{{< /details >}}

Und dann Schritte, um die Nachnutzbarkeit zu verbessern...

{{< details summary="Prompt" >}}
```
Now, we should improve reusability:
* Make sure StoryMap handles resizes and is reactive
* Create a constructor to StoryMap, where I can pass an element to attach to, the source file as URL or a JSON structure, and all possible options, also add it to the usage documentation and use it in index.html
* Make sure to expose the OpenLayers options can be passed in the constructor (make sure a passed map element is replaced by the real one).
  * Add StoryMap options to disable: map, overview, back to the beginning, and full screen
  * Make sure the examples in contrib still work (with the ES6 version, no IIFE).
* Make sure map options are exposed by StoryMap to be changed at runtime
* Add JSdoc to the public API, check if all other docs are aligned with the current state
* Create a migration guide from the original StoryMap (still in the master branch) to this version:
* Make sure that the current slide is always part of the URL (by adding a hash identifier).
* Document how to use custom HTML can be used in the slide content
* Make it possible to limit the map to a bbox:
  * Make sure that the background of the slide content isn't incorporated in the bbox size calculation if this background is a solid color. In that case:
* Add an option that would each inclusion of an external service would ask for permission due to GDPR.
  * Use https://github.com/js-cookie/js-cookie to save the consent state locally.
* Remove the bundled map_access_token and Flickr key.
* Make sure that the current slide is always part of the URL (by adding a hash identifier).
* Check if code from Animation/Ease is provided by external modules, can we replace it by dependencies?
* Make sure we bundle the TS sources in the NPM package!
* Check for bugs, unused code, and if all docs and examples are consistent with the current implementation:
* Change the URLs in package.json to this fork, remove the private, add the org '@projektemacher' to the name, add a job to deploy on NPM and GitHub packages (we need to change the org to '@cmahnke' during this deployment). Make sure all GitHub Actions run on the current branch!
* Make sure the NPM package ship types (using unplugin-dts).
* Create issue templates (Bug + Feature), also add a category for backward compatibility with the original KnightLab story map, add a field for the storymap.json, mention embed page on github for testing.
* Add constructor options to disable: map, overview, back to the beginning, and full screen.

After each step, commit to the working Git branch. Use subagents
```
{{< /details >}}

Und dann die bestehenden Issues, hier war das Ergebnis eine Liste die dann in Gruppen abgearbeitet werden konnte

{{< details summary="Prompt" >}}
```
The next phase is to eliminate known bugs.
* Read every known issue (bugs, enhancements, uncategorised) from: https://github.com/NUKnightLab/StoryMapJS/issues
* Check if they only apply to the viewer and are unrelated to legacy things like zoomify, and don't relate to backend stuff like hosting, infrastructures, imports, etc...
* Create Playwright tests to check if they still apply, if so, write them (with bug ID and test file name) in a Markdown file (KNOWN_ISSUES.md).
```
{{< /details >}}

Und dann noch etwas Webseiten-Infrastruktur:

{{< details summary="Prompt" >}}
```
* Change index.html (and other pages) to make it look like https://storymap.knightlab.com/, get the CSS, but make sure it's not mixed with the CSS of the StoryMap JS styles, the typography and anything else should look like the given page.
  * Use the "US WESTWARD EXPANSION" from https://storymap.knightlab.com/ as demo on index.html, make sure it matches as exactly as possible (including CSS and behaviour).
  * On the page, integrate links (add to navbar-secondary) to HTML Version of README, the migration guide, and the IIIF documentation (also apply the style from the page), as well as advances and help (if they are part of this repository).
  * Create a section linking to the examples (should look like this: https://storymap.knightlab.com/#examples).
  * If there are logos of the original authors / institutions (Knight Lab / Northwestern University), add a greyscale filter to them, and change the opacity to .5.
  * Build JSDocs and add them to the menu in index.html, consider reusing the stylesheet if easily possible!
* Make sure index.html is deployed using GitHub Pages (using a GH Pages branch).

After each step, commit to the working Git branch. Use subagents

```
{{< /details >}}

## Nacharbeiten

Grundsätzlich war es nach diesen Schritten aber nicht getan. Sie waren vielmehr eine Vorbereitung für weitere, eher kleinteilige Schritte, die sich daher nicht wirklich als kompakte Prompts ausdrücken lassen. Diese reichten von visuellen (UI) Fehlerbehebungen über kleinere bis mittlere Verbesserungen der Linien-Animation bis zur Demo-Seite (inklusive der Verbesserung der Dokumentation). Dazu kamen größere Verbesserungen, so hat der Agent alle einfachen bis mittleren Bugs und Verbesserungen aus dem [Bugtracker](https://github.com/NUKnightLab/StoryMapJS/issues) behoben bzw. implementiert, falls sie noch aktuell waren. Beispiele:

{{< details summary="Prompt" >}}
```
* Make sure that the line animation runs backwards (retract) if the back button is used.
* Transparent backgrounds should be set using RGBA colours, not filters!
Try to preload at least the next slide, currently, loading external media types seems to slow down the animation!
* On desktop touch devices, show a bouncing downward arrow if the slide box overflows (center), hide it after the first scroll. Make sure that the touch scroll bar has a better contrast and is wider (wide enough for easy touch).

* Make sure the UI is reactive!
* Make sure the demo looks like this: (https://uploads.knightlab.com/storymapjs/fe78caa5c21790f56f0bb53cba313ab9/the-most-expensive-transfers-in-football-history/index.html).
* Use the OSM basemap (from https://tiles.openfreemap.org/styles/bright) and [OpenFreeMap](https://openfreemap.org/) as free tile source
```
{{< /details >}}

## Offene Punkte

Zwei Features sind bisher offen geblieben, da der Bedarf dafür bisher nicht gegeben war:
* Ein IIIF-Dialekt als internes Format
* Die Verlagerung der Karten-Marker in OpenLayers (als Layer?). Dies würde es beispielsweise erlauben, das Clustering von OpenLayers zu verwenden.

## Ergebnis:

* Der renovierte Code ist nun auf GitHub verfügbar.
* Viele der offenen [Probleme der Originalimplementierung](https://github.com/NUKnightLab/StoryMapJS/issues) konnten behoben werden.
* Es existiert eine [Demo-Seite](https://cmahnke.github.io/StoryMapJS/).
* Zusätzlich kann der Code über [NPM bezogen werden](https://www.npmjs.com/package/@projektemacher/storymapjs).

Die Anwendung für die Ausstellung kann dann nach der Eröffnung im Forum Wissen bewundert werden...

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
