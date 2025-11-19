---
date: 2025-03-26T07:00:44+02:00
title: "Quantenkosmos Göttingen"
description: "Ein digitales Exponat"
cite: true
tags:
  - Exhibition
  - Website
  - Geodata
  - JavaScript
  - Göttingen
  - History
  - OpenStreetMap
preview: screenshot.png
wikidata:
  - https://www.wikidata.org/wiki/Q464980
  - https://www.wikidata.org/wiki/Q1144457
---

Heute (26.3.) ist die Eröffnung der Ausstellung ["Was zum Quant?!"](https://www.forum-wissen.de/event/eroeffnung-was-zum-quant/) im Forum Wissen. Zu sehen ist auch ein digitales Exponat, an dem ich beteiligt war...
<!--more-->

Die Installation "Quantenkosmos Göttingen" zeigt die Wohn- und Wirkstätten der Quantenphysiker in Göttingen vom Sommersemester 1921 bis zum Wintersemester 1936/36. Der zugrunde liegende Stadtplan ist dabei frei skalierbar, am unteren Ende erlaubt der Zeitstrahl die Auswahl des Semesters.
Vergleichbar zu Europeana.4D, GeoTemCo, oder der Dariah GeoBrowser...

Die Daten wurden von Pia Denkmann erhoben, die Geodaten-Anreicherung, JSON Transformation und das Web-Frontend sind von mir. Die Texte schrieben Christine Nawa und Ramona Dölling. Die Einpassung in die Ausstellung wurde von der Agentur [Cognitio](https://www.cognitio.de/) durchgeführt.

{{< gallery >}}
[
  {"src": "screenshot.png", "alt": "Screenshot des Prototyps"}
]
{{</ gallery >}}

# Technische Details

Die Karte wurde mit QGIS georeferenziert.

Die Koordinaten der Adressen werden mit [Nominatim](https://nominatim.openstreetmap.org/) des OpenStreetMap Projektes ermittelt.

# Update

{{< figure src="final.jpeg" alt="Fertige Version" class="post-image" caption="Angepasst auf die Ausstellungsgrafik" >}}
