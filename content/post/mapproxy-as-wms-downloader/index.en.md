---
date: 2025-11-13T20:14:44+02:00
title: "Mapproxy als WMS Downloader"
tags:
- Geodata
---

Sometimes you need map tiles from a WMS server...
<!--more-->

Once again, I needed topographical (elevation) data, but unlike in the [post on climate change](/en/post/marmolada-woodcut/), not to process it in Blender, but in a form that could be further processed in a browser. Unfortunately, they are only available via a [WMS service](https://en.wikipedia.org/wiki/Web_Map_Service)...

There are various programmes available, such as [`wms-tiles-downloader`](https://github.com/lmikolajczak/wms-tiles-downloader) or [`wms-tile-get`](https://github.com/easz/wms-tile-get), but these have problems if the data is not delivered in the Web Mercator projection (EPSG:3857).

Fortunately, there is [Mapproxy](https://mapproxy.org/). Even though it is not actually intended for this purpose, it does the job quickly and also offers advanced features such as reprojecting the tiles into different [coordinate reference systems](https://en.wikipedia.org/wiki/Spatial_reference_system).

One example is the [Digital Terrain Model (DGM1) for Lower Saxony](https://geoportal.geodaten.niedersachsen.de/harvest/srv/api/records/740e33da-3310-4173-bae1-d30c31124b3a). This is provided online as a WMS endpoint by the [State Office for Geoinformation and Land Surveying of Lower Saxony (LGLN)](https://www.lgln.niedersachsen.de/).

Mapproxy can use this endpoint and translate it directly into an access scheme other than WMS. For this example, we will use the [Slippy Map URL scheme](https://wiki.openstreetmap.org/wiki/Slippy_map), which is also used by OpenStreetMap.

Mapproxy can either be installed easily via package management (`pip`, `brew`, `apk`, `apt-get`, `dnf`, etc.) or using a Docker image. For more information, see the [documentation](https://mapproxy.github.io/mapproxy/latest/install.html).

Then, simply create an empty directory and place the following files in it.

The configuration for the service itself:

```yaml
# mapproxy.yaml
# -----------------------
# MapProxy configuration.
# -----------------------
services:
# This is the webservice useful during setting up the configuration
# See http://localhost:8080/demo/
  demo:
# The service to serve the tiles
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
# This is the cache for the reprojected tiles, save them
  dgm1_cache:
    grids: [webmercator]
    sources: [dgm1_cache_original]
# This defines the location and directory structure of the downloaded tiles
    cache:
      type: file
      directory: ./cache_data
      directory_layout: tms
      coverage:
# This limits the downloaded tiles to a area arround Göttingen
          bbox: [9.7, 51.45, 10.1, 51.6]
          srs: GLOBAL_WEBMERCATOR
# This is the cache for the dowloaded tiles, don't save them
  dgm1_cache_original:
    sources: [dgm1_wms]
    grids: [dgm1_grid]
    disable_storage: true

grids:
# The SRS for the source, needed to mal Mapproxy reproject the tiles
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
# This is important for the topographic tiles, to make sure that the colors
# match between tiles. Otherwise you'll see jups in height between tiles.
          quantizer: mediancut

```

The configuration for the "seeder" (actually intended to fill the service's cache, but we use it as a downloader):

```yaml
#seed.yml
# -------------------------------
# MapProxy seeding configuration.
# -------------------------------

seeds:
  dgm1_seed:
    caches: [dgm1_cache]
    coverages: [goettingen]
# It's possible to configure the (zoom) levels to be fetched
    levels:
      from: 11
      to: 15

coverages:
  goettingen:
    bbox: [9.7, 51.45, 10.1, 51.6]
    srs: EPSG:3857
```

To test whether the configuration is correct, simply run `mapproxy-util serve-develop ./mapproxy.yaml`. Then open the address [http://localhost:8080/demo/](http://localhost:8080/demo/) in your browser to test the configuration.

If everything (output service, projections, image and directory formats) is configured correctly, the download can be started with the command `mapproxy-seed`:

```
mapproxy-seed -s ./seed.yaml -f ./mapproxy.yaml
```

Once the process is complete, the desired directories and files will be located in the `cache_data` directory.
