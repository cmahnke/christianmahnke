---
date: 2025-11-16T20:22:44+02:00
title: "hdr-canvas 0.1.0 veröffentlicht"
keywords: NPM, TypeScript
cite: true
tags:
  - JavaScript
  - HDR
wikidata:
  - https://www.wikidata.org/wiki/Q7067518
  - https://www.wikidata.org/wiki/Q2005
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q978185
---

`hdr-canvas` Version 0.1.0 veröffentlicht...
<!--more-->

Ein Ergebnis meiner Arbeit mit HDR-Inhalten im Browser ist ein NPM-Modul, das auch zur Erstellung der Beiträge in diesem Blog verwendet wurde.
Seit den ersten Versionen ist aber ungefähr ein Jahr vergangen und die Browser-API war damals eher als experimentell zu bezeichnen. Seitdem hat sich einiges geändert – eines der Beispiele hatte in der Zwischenzeit sogar aufgehört zu funktionieren: Die wichtigste Änderung betrifft die Änderung von `Uint16` zu `Float16` als 16 Bit Pixeldatentyp für HDR.

Da sich Browser schnell weiterentwickeln und der Betrieb älterer Browser aus Sicherheitsgründen nicht zu empfehlen ist (auch wenn manche das anders sehen), ist **keine Abwärtskompatibilität** zu erwarten.

Neben den notwendigen Anpassungen bietet die neue Version auch Verbesserungen im Bereich der Dokumentation und der Beispiele.

Der Code ist auf [GitHub](https://github.com/cmahnke/hdr-canvas) und [NPM](https://www.npmjs.com/package/hdr-canvas) zu finden.

# Die Release Notes

## Einleitung

Seit der letzten Veröffentlichung haben sich viele Bereiche der Verarbeitung von HDR-Inhalten im Browser weiterentwickelt.
Am auffälligsten ist sicherlich die Einführung von „Float16Array” im „ImageData”-Konstruktor:

- Die [WhatWG-Spezifikation](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#imagedataarray), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData# Syntax) und [BCD]([new ImageData(new Float16Array(4), 1, 1, {pixelFormat:„rgba-float16“})](https://github.com/mdn/browser-compat-data/issues/27547)) wurden entsprechend aktualisiert. Sie können Ihren eigenen Browser mit `new ImageData(new Float16Array(4), 1, 1, {pixelFormat:„rgba-float16“})` testen.
  - Noch offen in [Firefox](https://bugzil.la/1958830)
  - In [Safari](https://webkit.org/b/291196) hinter einem Flag versteckt
  - Chromium hat es ab [137](https://source.chromium.org/chromium/chromium/src/+/refs/tags/137.0.7104.0:third_party/blink/renderer/core/html/canvas/image_data.idl) implementiert: \*\*Der Konstruktor `ImageData` akzeptiert nur `Float16Array` anstelle von `Uint16Array`. Dadurch werden ältere Versionen dieses Moduls überflüssig, da sie auf die Chromium-spezifische Lösung ausgerichtet waren.
  - Wenn Safari dies standardmäßig aktiviert, wird es auch in den [Typescript-DOM-Typen](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107) enthalten sein.

Wie [@reitowo](https://github.com/reitowo) bereits angemerkt hat, gab es eine Änderung an der Methode `getContext(„2d“)`. Der Schlüssel `pixelFormat` wurde durch `colorType` ersetzt.

Parallel dazu gab es Änderungen am UltraHDR-Bildformat, insbesondere bei der Kodierung der Metadaten der Gain-Map. Während dies früher in XMP erfolgte, geschieht dies nun gemäß ISO 21496-1. Dies wurde von Google und Apple in neueren Betriebssystemversionen wie Android 15 und iOS 18 übernommen, um eine plattformübergreifende Fragmentierung zu vermeiden. Die [UltraHDR-Bibliothek](https://github.com/google/libultrahdr) wurde bereits so geändert, dass sie [standardmäßig das ISO-Format verwendet](https://github.com/google/libultrahdr/blob/main/docs/building.md).

Derzeit weiß der ThreeJS UHDR-Loader nicht, wie er mit dieser Änderung umgehen soll, siehe [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).

## Wichtige Änderungen und neue Funktionen

- Bessere Unterstützung für offizielle Web-APIs
  - Verwendung von `Float16Array` anstelle von `Uint16Array`
  - Verwendung der richtigen Option zur Initialisierung des 2D-Canvas-Kontexts

### Verbesserte Dokumentation

Die Dokumentation wurde erheblich verbessert. Es gibt jetzt auch eine [Website](https://cmahnke.github.io/hdr-canvas/) mit Beispielen und API-Dokumentationen.

### Beispiele

Die Beispiele aus dem Blog sind nun Teil dieses Repositorys:

- [`tests/site/assets/ts/hdr-three.js.ts`](tests/site/assets/ts/hdr-three.js.ts) – Three JS mit HDR-Textur
- [`tests/site/assets/ts/image-slider.ts`](tests/site/assets/ts/image-slider.ts) – Generierte HDR-Inhalte
- [`tests/site/assets/ts/main.ts`](tests/site/assets/ts/main.ts) – Funktionserkennung

Diese Beispiele sind auch auf der neuen [Dokumentationsseite](https://cmahnke.github.io/hdr-canvas/) verfügbar.

## Einflussnahme

Da die Änderungen der WhatWG noch nicht übernommen worden waren, mussten einige Probleme in den entsprechenden Repositories angesprochen werden.

- [mdn/content#40639](https://github.com/mdn/content/issues/40639)
- [mdn/browser-compat-data#27547](https://github.com/mdn/browser-compat-data/issues/27547)
- [microsoft/TypeScript-DOM-lib-generator#2107](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)
- [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).
