---
date: 2025-11-30T11:22:44+02:00
title: "hdr-canvas aktualisiert"
keywords: NPM, TypeScript
aliases:
  - /post/hdr-canvas-0.1.0
cite: true
tags:
  - JavaScript
  - HDR
wikidata:
  - https://www.wikidata.org/wiki/Q7067518
  - https://www.wikidata.org/wiki/Q2005
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q978185
  - https://www.wikidata.org/wiki/Q116963687
  - https://www.wikidata.org/wiki/Q28957081
  - https://www.wikidata.org/wiki/Q136933249
  - https://www.wikidata.org/wiki/Q3525922
  - https://www.wikidata.org/wiki/Q615940
  - https://www.wikidata.org/wiki/Q110650833
  - https://www.wikidata.org/wiki/Q5439690
  - https://www.wikidata.org/wiki/Q6368
  - https://www.wikidata.org/wiki/Q79534
lastmod: 2026-10-13T00:00:00+02:00
---

`hdr-canvas` aktualisiert...
<!--more-->

Ein Ergebnis meiner Arbeit mit HDR-Inhalten im Browser ist ein NPM-Modul, das auch zur Erstellung der Beiträge in diesem Blog verwendet wurde.
In diesem Beitrag werden die letzten Änderungen zusammengefasst. Bei neuen Versionen wird er aktualisiert.

# Version 0.4.0

# Einleitung

Diese Version führt wieder eine ressourcenschonende Methode zur Skalierung von Farben in den HDR-Bereich ein und schließt die Bereinigung von `Uint16` ab: `Uint16Array` war der experimentelle HDR-Pfad in Chromium vor Version 137; er ist bewusst weder Teil der WHATWG-Spezifikation (nur `Uint8ClampedArray | Float16Array`) noch der TypeScript-

# Wichtige Änderungen und neue Funktionen

- Neue HDR-Verstärkungsskalierung `Float16Image` (ersetzt die entfernte, auf `colorjs.io` basierende Konvertierung durch eine abhängigkeitsfreie lineare Verstärkung)
  - `applyGain(gain)` (in situ) und `scaled(gain)` (auf einer Kopie), mit einheitlicher Verstärkung `number` oder kanalweiser Verstärkung `[r, g, b]`. Alpha wird standardmäßig beibehalten.
  - Werte `>1` werden in den HDR-Headroom verschoben und sind nur auf einer Leinwand mit `toneMapping: { mode: "extended" }` sichtbar (siehe `getHdrOptions()`), andernfalls werden sie auf SDR-Weiß abgeschnitten.
  - Der Demo-Bildschieberegler (`tests/site/assets/ts/image-slider.ts`) verwendet nun `scaled()` anstelle seines selbst implementierten `pixelCallback` (Schieberegler `50` entspricht Verstärkung `1`, `100` entspricht Verstärkung `2`).
  - Neue Testsuite `Float16ImageGain`.
- Bereinigung der Typen (mit Kompatibilitätsbruch)
  - `Uint16Array` wurde aus den exportierten Typen `HDRImageDataArray` und `HDRImageData` entfernt.
  - `HDRImage.SDR_MULTIPLIER` wurde als veraltet markiert (aus Kompatibilitätsgründen beibehalten; verwende stattdessen `applyGain()` / `scaled()`) und die Dokumentation zu `HDRImagePixelCallback` wurde korrigiert (Ganzzahlen von `0–65535` auf Floats von `0–1` für SDR bzw. `>1` für HDR-Headroom).
- Dokumentation: In der README-Datei wird der Paketbereich angegeben (`@projektemacher/hdr-canvas` auf npm, `@cmahnke/hdr-canvas` auf GitHub Packages).
- Experimentelle WASM-Beschleunigung zur Leistungssteigerung (AssemblyScript-Kernel, als Base64 eingebettet, standardmäßig deaktiviert und über `setWasmEnabled(true)` mit transparentem JS-Fallback aktiviert)
  - Gemessen auf Node 24 über 12 Millionen Werte: JS ~12 ms gegenüber WASM ~51 ms (~3 ms Kopiervorgänge) – Engines mit nativem `Float16Array` nutzen eine hardwarebasierte F16C-Konvertierung, die der Skalar-Kernel nicht übertreffen kann; daher bleibt das Flag vorerst deaktiviert und dient als getestete Infrastruktur (Parität innerhalb von 1 ulp) für zukünftige rechenintensive Kernel.
- Pflege der Zitiermetadaten (`url`, `dateReleased`) und Aktualisierung der Abhängigkeiten (einschließlich `assemblyscript` als `devDependency`).

## Version 0.3.1

## Einleitung

Reine Metadaten-Veröffentlichung, keine funktionalen Änderungen seit 0.3.0.

## Wichtige Änderungen und neue Funktionen

- `CITATION.cff` und `codemeta.json` wurden hinzugefügt (mit einem Workflow, der die Dateien synchron hält).
- Ein Deploy-Guard wurde zu `.github/workflows/npm.yml` hinzugefügt: Die Veröffentlichung wird übersprungen, wenn die Version bereits im Registry vorhanden ist, sodass erzwungene manuelle Neuveröffentlichungen nicht mehr fehlschlagen.
- Versionssprung von 0.3.0 auf 0.3.1.

## Version 0.3.0

### Einleitung

Mit dieser Version wird das Paket in eine Organisation verschoben und WCG von der HDR-Erkennung getrennt.

Das Paket wird nun als `@projektemacher/hdr-canvas` auf npm veröffentlicht (GitHub Packages veröffentlicht es als `@cmahnke/hdr-canvas` über eine Umschreibung in `.github/workflows/npm.yml`):

```
npm i @projektemacher/hdr-canvas
```

Außerdem wurde `main` auf `dist/hdr-canvas.js` korrigiert und der Tippfehler `LICENCE` in der Liste `files` in `LICENSE` geändert.

## Wichtige Änderungen und neue Funktionen

- WCG und HDR separat erkennen ([#23](https://github.com/cmahnke/hdr-canvas/issues/23), [#107](https://github.com/cmahnke/hdr-canvas/issues/107))
  - Neue Prüfungen: `checkWCG`, `checkWCGCanvas`, `checkDynamicRangeHigh`, `checkColorGamutP3` / `checkColorGamutRec2020` und `getWcgOptions()` (`display-p3`, für Browser, die nur WCG unterstützen, wie Safari und Firefox unter macOS).
  - Neue Funktionen `getDisplayCapabilities()` und `onDisplayChange()` (Abonnements für `change`-Ereignisse bei Media Queries mit Polling-Fallback), sodass beim Verschieben eines Fensters zwischen Bildschirmen die Anzeige neu bewertet wird.
  - Überprüfungen gegen fehlende `window` / `document` / `screen` wurden verstärkt.
  - Demo-Website, README-Dokumentation und Import-Fixture wurden aktualisiert; neue Testsuiten `hdr-check` und `display-change` wurden hinzugefügt.
- Robustere Basisklasse `HDRImage`
  - Nicht implementierte Stubs für `fromImageData` / `fromImageDataArray` wurden entfernt.
  - `loadSDRImageData()` prüft `response.ok` und fängt Fehler ab, anstatt den Vorgang abzubrechen.
  - `getPixel()` / `setPixel()` lösen außerhalb der Bildgrenzen einen `RangeError` aus.
  - `clone()` wurde korrigiert, sodass nun tatsächlich eine tiefe Kopie von `data` erstellt wird.
- Die Safari-Handhabung wurde in `src/browser.ts` (`isSafari()`) ausgelagert und wird in `src/hdr-canvas.ts` sowie (dupliziert und synchronisiert) in `three/HDRWebGPUBackend.js` wiederverwendet.
- `defaultGetContextHDR()` ist nun idempotent und passt nur `"2d"`-Kontexte an; `resetGetContext()` stellt den ursprünglichen `getContext` vollständig wieder her.
- Neue globale Konfiguration in `tests/version-check.ts`, die `engines.node` für den Testlauf erzwingt.
- Aktualisierungen der Abhängigkeiten, einschließlich `vitest` von Version 4 auf 5.

## Version 0.2.0

### Einleitung

Folgende Elemente wurden entfernt:

- die Unterstützung für Chrom(e|ium) < 140
- `Uint16Image`
- Hilfsfunktionen zur Überprüfung der Browserversion
- gebündelte UMD- und IIFE-Builds
- `colorjs.io` ist keine direkte Abhängigkeit mehr

Unterstützung für Safari wurde eingeführt (aktuelles Ziel ist Safari Technology Preview R232 und höher): Dies erfordert das Feature-Flag "Canvas Color Types and ImageData Pixel Formats". Der Farbraum `rec2100-hlg` wird derzeit jedoch nicht unterstützt.

### Wichtige Änderungen & neue Funktionen

- Check-Funktion für `Float16Array`
- Die Unterstützung für `Float16Array` wird nun von [`@petamoriken/float16`](https://www.npmjs.com/package/@petamoriken/float16) übernommen

### Entfernung von [`colorjs.io`](https://colorjs.io/)

Obwohl `colorjs.io` für Farbraumkonvertierungen sehr hilfreich ist, vergrößert es das Paket erheblich. Da es andere Pakete für die Verarbeitung von `Float16` gibt, wurde das Paket entfernt. Wenn Sie eigene Konvertierungen benötigen, fügen Sie es Ihrem Projekt hinzu:

```
npm install colorjs.io
```

## Version 0.1.1 - 0.1.2

Diese Aktualisierungen waren notwendig, um diese Blogbeiträge zu reparieren:
* [UV-Photogrammetrie](https://christianmahnke.de/post/uv-photogrammetry/)
* [Kontrasterhöhung für UV Aufnahmen mittels HDR Darstellung](https://christianmahnke.de/post/hdr-image-analysis/)

### 0.1.1

#### Änderungen an der Initialisierung eines `WebGPU` Kontexts für `canvas`

Die Änderungen bei der Initialisierung eines `canvas` für einen Renderer werden in der [Erklärung](https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md) beschrieben.

Die wichtigste Änderung ist die Umbenennung von „colorMetadata” in:

```
toneMapping: { mode: „extended“ }
```

### 0.1.2

Die Farbskalierung von `Float16Image` war falsch, die Skalierung funktionierte nur für 0% - 1%.

## Version 0.1.0
Seit den ersten Versionen ist aber ungefähr ein Jahr vergangen und die Browser-API war damals eher als experimentell zu bezeichnen. Seitdem hat sich einiges geändert – eines der Beispiele hatte in der Zwischenzeit sogar aufgehört zu funktionieren: Die wichtigste Änderung betrifft die Änderung von `Uint16` zu `Float16` als 16 Bit Pixeldatentyp für HDR.

Da sich Browser schnell weiterentwickeln und der Betrieb älterer Browser aus Sicherheitsgründen nicht zu empfehlen ist (auch wenn manche das anders sehen), ist **keine Abwärtskompatibilität** zu erwarten.

Neben den notwendigen Anpassungen bietet die neue Version auch Verbesserungen im Bereich der Dokumentation und der Beispiele.

Der Code ist auf [GitHub](https://github.com/cmahnke/hdr-canvas) und [NPM](https://www.npmjs.com/package/hdr-canvas) zu finden.

### Die Release Notes

#### Einleitung

Seit der letzten Veröffentlichung haben sich viele Bereiche der Verarbeitung von HDR-Inhalten im Browser weiterentwickelt.
Am auffälligsten ist sicherlich die Einführung von „Float16Array” im „ImageData”-Konstruktor:

- Die [WhatWG-Spezifikation](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#imagedataarray), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData#syntax) und [BCD](https://github.com/mdn/browser-compat-data/issues/27547)) wurden entsprechend aktualisiert. Sie können Ihren eigenen Browser mit `new ImageData(new Float16Array(4), 1, 1, {pixelFormat:„rgba-float16“})` testen.
  - Noch offen in [Firefox](https://bugzil.la/1958830)
  - In [Safari](https://webkit.org/b/291196) hinter einem Flag versteckt
  - Chromium hat es ab [137](https://source.chromium.org/chromium/chromium/src/+/refs/tags/137.0.7104.0:third_party/blink/renderer/core/html/canvas/image_data.idl) implementiert: \*\*Der Konstruktor `ImageData` akzeptiert nur `Float16Array` anstelle von `Uint16Array`. Dadurch werden ältere Versionen dieses Moduls überflüssig, da sie auf die Chromium-spezifische Lösung ausgerichtet waren.
  - Wenn Safari dies standardmäßig aktiviert, wird es auch in den [Typescript-DOM-Typen](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107) enthalten sein.

Wie [@reitowo](https://github.com/reitowo) bereits angemerkt hat, gab es eine Änderung an der Methode `getContext(„2d“)`. Der Schlüssel `pixelFormat` wurde durch `colorType` ersetzt.

Parallel dazu gab es Änderungen am UltraHDR-Bildformat, insbesondere bei der Kodierung der Metadaten der Gain-Map. Während dies früher in XMP erfolgte, geschieht dies nun gemäß ISO 21496-1. Dies wurde von Google und Apple in neueren Betriebssystemversionen wie Android 15 und iOS 18 übernommen, um eine plattformübergreifende Fragmentierung zu vermeiden. Die [UltraHDR-Bibliothek](https://github.com/google/libultrahdr) wurde bereits so geändert, dass sie [standardmäßig das ISO-Format verwendet](https://github.com/google/libultrahdr/blob/main/docs/building.md).

Derzeit weiß der ThreeJS UHDR-Loader nicht, wie er mit dieser Änderung umgehen soll, siehe [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).

#### Wichtige Änderungen und neue Funktionen

- Bessere Unterstützung für offizielle Web-APIs
  - Verwendung von `Float16Array` anstelle von `Uint16Array`
  - Verwendung der richtigen Option zur Initialisierung des 2D-Canvas-Kontexts

##### Verbesserte Dokumentation

Die Dokumentation wurde erheblich verbessert. Es gibt jetzt auch eine [Website](https://cmahnke.github.io/hdr-canvas/) mit Beispielen und API-Dokumentationen.

##### Beispiele

Die Beispiele aus dem Blog sind nun Teil dieses Repositorys:

- [`tests/site/assets/ts/hdr-three.js.ts`](tests/site/assets/ts/hdr-three.js.ts) – Three JS mit HDR-Textur
- [`tests/site/assets/ts/image-slider.ts`](tests/site/assets/ts/image-slider.ts) – Generierte HDR-Inhalte
- [`tests/site/assets/ts/main.ts`](tests/site/assets/ts/main.ts) – Funktionserkennung

Diese Beispiele sind auch auf der neuen [Dokumentationsseite](https://cmahnke.github.io/hdr-canvas/) verfügbar.

#### Einflussnahme

Da die Änderungen der WhatWG noch nicht übernommen worden waren, mussten einige Probleme in den entsprechenden Repositories angesprochen werden.

- [mdn/content#40639](https://github.com/mdn/content/issues/40639)
- [mdn/browser-compat-data#27547](https://github.com/mdn/browser-compat-data/issues/27547)
- [microsoft/TypeScript-DOM-lib-generator#2107](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)
- [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).


# Update 13.10.2026

Wie bereits [angekündigt](/post/npm-org/) wurde `hdr-canvas` in [`@projektemacher/hdr-canvas`](https://www.npmjs.com/@projektemacher/hdr-canvas) unbenannt.
