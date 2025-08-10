---
date: 2025-08-12T15:22:44+02:00
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
draft: true
---

`hdt-canvas` Version 0.1.0 veröffentlicht...
<!--more-->

Ein Ergebnis meiner Arbeit mit HDR-Inhalten im Browser ist ein NPM-Modul, das auch zur Erstellung der Beiträge in diesem Blog verwendet wurde.
Seit den ersten Versionen ist aber ungefähr ein Jahr vergangen und die Browser-API war damals eher als experimentell zu bezeichnen. Seitdem hat sich einiges geändert – eines der Beispiele hatte in der Zwischenzeit sogar aufgehört zu funktionieren: Die wichtigste Änderung betrifft die Änderung von `Uint16` zu `Float16` als 16 Bit Pixeldatentyp für HDR.

Da sich Browser schnell weiterentwickeln und der Betrieb älterer Browser aus Sicherheitsgründen nicht zu empfehlen ist (auch wenn manche das anders sehen), ist **keine Abwärtskompatibilität** zu erwarten.

Neben den notwendigen Anpassungen bietet die neue Version auch Verbesserungen im Bereich der Dokumentation und der Beispiele.

Der Code ist auf [GitHub](https://github.com/cmahnke/hdr-canvas) und [NPM](https://www.npmjs.com/package/hdr-canvas) zu finden. 
