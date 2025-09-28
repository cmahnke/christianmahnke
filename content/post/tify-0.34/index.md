---
date: 2025-09-27T11:22:44+02:00
title: "Von Mirador zu Tify"
tags:
  - Projektemacher.org
  - Blog
  - IIIF
---
Projektemacher.org nutzt nun Tify...
<!--more-->

Bisher haben meine [Projektemacher-Blogs](https://projektemacher.org/blogs/) für die Darstellung von IIIF-Präsentationsmanifesten den IIIF Viewer "[Mirador](https://projectmirador.org/)" genutzt. Das hat sich nun aus verschiedenen Gründen geändert:

In den letzten Jahren wurde die Nutzung von Mirador zunehmend kompliziert, da eine [Änderung für die Unterstützung von "Lücken" in Seitensequenzen (PR #2029)](https://github.com/ProjectMirador/mirador/pull/3029) nie in den Hauptzweig aufgenommen wurde. Da die Änderung nicht weiter gepflegt wurde, blieb der Viewer auf dem Stand einer Entwicklungsversion von Anfang 2024 eingefroren.

Gleichzeitig habe ich schon seit einiger Zeit mit dem IIIF Viewer "[Tify](https://tify.rocks/)" geliebeugelt, auch weil ich die an der Entwicklung Beteiligten kenne. Bisher war die Entwicklung nicht auf einen breiten Einsatz fokussiert, sodass es auch hier Probleme mit Lücken in Seitensequenzen oder auch Defizite in der vollständigen Kompatibilität mit statischen IIIF Bildern (Level 0).

Nun ist letzte Woche die [Version 0.34 von Tify](https://github.com/tify-iiif-viewer/tify/releases/tag/v0.34.0) herausgekommen und diese Version bieten nach Jahren des Wartens endlich Unterstützung für IIIF Image API [2.1 `viewingHint`](https://iiif.io/api/presentation/2.1/#viewinghint) und [3.0 `behavior`](https://iiif.io/api/presentation/3.0/#behavior) sowie vorgenerierte Thumbnails. Zusätzlicher ist Tify deutlich schlanker.

**Daher nutzen meine Blogs für die Anzeige von IIIF-Präsentationsmanifesten nun Tify!**

Hoffentlich bleibt die Entwicklung auf dem neuen Pfad in Richtung eines allgemein einsetzbaren IIIF-Viewers und ergänzt noch die [Anzeige von IIIF Image API Endpunkten](https://github.com/tify-iiif-viewer/tify/issues/129).
