---
date: 2026-10-16T19:52:22+02:00
title: 'KI für Strukturmetadaten'
params:
  cite: true
  wikidata:
    - https://www.wikidata.org/wiki/Q8275050
    - https://www.wikidata.org/wiki/Q148443
    - https://www.wikidata.org/wiki/Q59164046
tags:
- Metadata
- AI
- OCR
---

Die [Kinderbücher](https://xn--kinderbcher-zhb.projektemacher.org/) haben nun Strukturmetadaten...
<!--more-->

Sie verbergen sich hinter dem Knopf "Inhalt" und im Viewer betrachtet werden.

Das "Besondere" daran, sie sind komplett mit Hilfe eines LLMs erstellt.

Meine bisherigen OCR Experimente mit KI haben nicht immer die gewünschten Ergebnisse erbracht, aber das lag meist daran, dass ich gleichzeitig Koordinaten erwartet habe, etwas, das allgemeine LLMs nicht wirklich beherrschen, alles was sie tun ist, sich welche ausdenken. Für die einfache Zuordnung, wie sie in dem Fall benötigt wird, sind ihre Fähigkeiten aber mehr als ausreichend: Das Modell muss einfach nur erkennen, welcher Text auf Seite steht. Daraus ergeben sich Kapitel, dazu kommen einfache Strukturen, wie der Buchdeckel und -rücken. Letztere (und einige weitere) wurden über das Prompt vorgegeben.

Und wie das Beispiel [Vater ist im Kriege (https://xn--kinderbcher-zhb.projektemacher.org/post/vater-ist-im-kriege/) zeigt, ist auch Frakturschrift kein Problem.

Das Buch [1x1 des Tapezierens – Versuch's mal selber!](https://vorsatzpapier.projektemacher.org/post/1x1-des-tapezierens/) auf [Vorsatzpapier!](https://vorsatzpapier.projektemacher.org/) ist übrigens auch erfasst und es zeigt, dass auch verschachtelte Strukturen funktionieren. Es demonstriert einen anderen Ansatz: Bei diesem Buch wurde einzig das Inhaltsverzeichnis (und initial die Paginierungssequenz) erkannt. Dieser Ansatz ist schneller / kostengünstiger, weil nicht jede Seite bearbeitet werden musste.
