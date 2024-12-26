---
date: 2024-04-19T17:33:44+02:00
title: "Daten Container"
keywords: GND, Geonames, Datenanreicherung, Datenquellen
description: "Die GND und Geonames als lokale Datenquellen"
tags:
  - Data
  - Docker
  - DNB
---

Auch wenn es nicht notwendigerweise der intendierte Use Case ist, kann man mit Docker sehr einfach auch umfangreiche Datenmengen mit Anwendungen zur vereinfachten Bereitstellungen (wie z.B. APIs) verpacken. Das kann besonders hilfreich sein wenn z.B. Normdaten aus verschiedenen Quellen für Datenanreicherungen zusammenführen will.
<!--more-->

# GND

Die [Gemeinsame NormDatei (GND)](https://www.dnb.de/EN/Professionell/Standardisierung/GND/gnd_node.html) beinhaltet Informationen zu Personen, Körperschaften usw., die bei der Nationalbibliothek hinterlegt sind.

Das Image basiert auf [Apache Jena](https://jena.apache.org/) und nutzt den [HDT](https://www.rdfhdt.org/) Abzug. Derzeit unterstützt das notwendige [Modul](https://github.com/rdfhdt/hdt-java) aber noch nicht Jena / Fuseki 5.0.

Der Container kann recht einfach gestartet werden:

```
docker run -it -p3030:3030  ghcr.io/cmahnke/data-containers/gnd:latest /bin/sh
```

Nach dem Starten kann der Datenbestand komfortabel im Browser recherchiert werden: [http://localhost:3030/#/dataset/gnd/query](http://localhost:3030/#/dataset/gnd/query)

# GeoNames

[GeoNames](https://www.geonames.org/) beinhaltet viele Informationen zu geographischen vielen Entitäten, dazu zählen Koordinaten, Schreibungsvarianten, sowie Hierarchisierung nach Gebieten.

Der Container beinhaltet aber nur die Koordinaten und Schreibungsvarianten, z.B. um für einen Ort die Koordinaten abrufen zu können. Die Daten werfen dafür in eine [Apache Solr](https://solr.apache.org/) Instanz eingespielt und können nach dem Starten

```
docker run -p 8983:8983 -it ghcr.io/cmahnke/data-containers/geonames
```

Einfach mit `curl` abgefragt werden, dabei wird das Ergebnis als JSON zurückgeben:

```
curl http://localhost:8983/solr/geonames/query?debug=query&q=n:G%C3%B6ttingen
```

# Weitere Nutzung

Die Kommandos zum Starten können auch mittels `docker-compose` z.B. zusammen mit Werkzeugen zur weiteren Analyse oder Zusammenführung zusammengefasst bzw. automatisiert werden.

Der Code ist auf [GitHub](https://github.com/cmahnke/data-containers), die Container [hier](https://github.com/cmahnke?tab=packages&repo_name=data-containers) verfügbar.
