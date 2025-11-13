---
date: 2025-11-13T20:14:44+02:00
title: "Mapproxy als WMS Downloader"
tags:
- Geodata
---

Manchmal braucht man Kartenkachel aus einem WMS Server...
<!--more-->

Ich brauchte mal wieder topographische (Höhen-)daten, aber anders als beim [Beitrag zum Klimawandel](/post/marmolada-woodcut/) nicht um sie in Blender zu verarbeiten, sondern in einer Form um sie im Browser weiterverarbeiten zu können. Leider sind nur über einen [WMS-Service](https://de.wikipedia.org/wiki/Web_Map_Service) abrufbar...

Es gibt zwar verschiedene Programme, wie [`wms-tiles-downloader`](https://github.com/lmikolajczak/wms-tiles-downloader) oder [`wms-tile-get`](https://github.com/easz/wms-tile-get), aber diese haben Probleme, wenn die Daten nicht in der Web-Mercator-Projektion (EPSG:3857) ausgeliefert werden.

Glücklicherweise gibt es [Mapproxy](https://mapproxy.org/). Auch wenn es eigentlich gar nicht direkt für diesen Zweck gedacht ist, erledigt es die Aufgabe schnell und bietet dazu noch fortschrittliche Features wie die Reprojektion der Kacheln in verschiedene [Koordinatenreferenzsysteme](https://de.wikipedia.org/wiki/Koordinatenreferenzsystem).

Ein Beispiel ist das [Digitales Geländemodell (DGM1) für Niedersachsen](https://geoportal.geodaten.niedersachsen.de/harvest/srv/api/records/740e33da-3310-4173-bae1-d30c31124b3a). Dieses wird vom [Landesamt für Geoinformation und Landesvermessung Niedersachsen (LGLN)](https://www.lgln.niedersachsen.de/) online als WMS-Endpunkt bereitgestellt.

Mapproxy kann diesen Endpunkt nutzen und direkt in ein anderes Zugriffsschema als WMS übersetzen. Für das Beispiel soll das [Slippy-Map-URL-Schema](https://wiki.openstreetmap.org/wiki/Slippy_map) genutzt werden, das auch von OpenStreetMap verwendet wird.

Mapproxy kann entweder einfach über die Paketverwaltung (`pip`, `brew`, `apk`, `apt-get`, `dnf` etc.) installiert werden oder es kann Docker-Image genutzt werden. Mehr dazu in der [Dokumentation](https://mapproxy.github.io/mapproxy/latest/install.html).

Danach reicht es ein leeres Verzeichnis anzulegen und die folgenden Dateien darin abzulegen.

Die Konfiguration für den Service selbst:
```yaml
# mapproxy.yaml
# -----------------------
# MapProxy configuration.
# -----------------------
services:
# Dies ist der Webservice, der beim Einrichten der Konfiguration nützlich ist.
# Siehe http://localhost:8080/demo/
  demo:
# Der Dienst zum Bereitstellen der Kacheln
  tms:
    use_grid_names: false
    origin: 'nw'

sources:
  dgm1_wms:
    type: wms
    supported_srs: ['EPSG:4326']
    req:
      url: https://opendata.lgln.niedersachsen.de/doorman/noauth/dgm_wms?
      layers: ni_dgm1_farbe
      transparent: true

layers:
  - name: dgm1
    title: DGM1
    sources: [dgm1_cache]

caches:
# Dies ist der Cache für die neu projizierten Kacheln, speichern Sie sie.
  dgm1_cache:
    grids: [webmercator]
    sources: [dgm1_cache_original]
# Hiermit werden der Speicherort und die Verzeichnisstruktur der heruntergeladenen Kacheln definiert.
    cache:
      type: file
      directory: ./cache_data
      directory_layout: tms
      coverage:
# Dadurch werden die heruntergeladenen Kacheln auf einen Bereich um Göttingen beschränkt.
          bbox: [9.7, 51.45, 10.1, 51.6]
          srs: EPSG:4326
# Dies ist der Cache für die heruntergeladenen Kacheln, diese werden nicht gespeichert.
  dgm1_cache_original:
    sources: [dgm1_wms]
    grids: [dgm1_grid]
    disable_storage: true

grids:
# Die SRS für die Quelle, die für die Neuprojektion der Kacheln mit Mapproxy erforderlich ist.
  dgm1_grid:
    srs: 'EPSG:4326'
  webmercator:
    base: GLOBAL_WEBMERCATOR

globals:
  mapserver:
    working_dir: .
  image:
    resampling_method: bicubic
    formats:
      image/png:
        encoding_options:
# Dies ist wichtig für die topografischen Kacheln, um sicherzustellen, dass die Farben
# zwischen den Kacheln übereinstimmen. Andernfalls kommt es zu Höhenunterschieden zwischen den Kacheln.
          quantizer: mediancut

```

Die Konfiguration für den "Seeder" (eigentlich dazu gedacht den Cache des Services zu füllen, wir benutzen ihn als Downloader):

```yaml
#seed.yml
# -------------------------------
# MapProxy seeding configuration.
# -------------------------------

seeds:
  dgm1_seed:
    caches: [dgm1_cache]
    coverages: [goettingen]
# Es ist möglich, die abzurufenden Zoom-Stufen zu konfigurieren.
    levels:
      from: 11
      to: 15

coverages:
  goettingen:
    bbox: [9.7, 51.45, 10.1, 51.6]
    srs: EPSG:4326
```

Um zu testen, ob die Konfiguration korrekt ist, genügt es, `mapproxy-util serve-develop ./mapproxy.yaml` auzuführen. Danach kann die Adresse [http://localhost:8080/demo/](http://localhost:8080/demo/) im Browser geöffnet werden um die Konfiguration zu testen.

Wenn alles (Ausgangsservice, Projektionen, Bild- und Verzeichnisformate) richtig konfiguriert ist, kann mit dem Befehl `mapproxy-seed` der Download gestartet werden:

```
mapproxy-seed -s ./seed.yaml -f ./mapproxy.yaml
```

Nach Abschluss des Prozesses befinden sich die gewünschten Verzeichnisse und Dateien im Verzeichnis `cache_data`.
