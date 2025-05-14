---
date: 2024-04-19T17:33:44+02:00
title: "Data Containers"
keywords: GND, Geonames, data enrichment, data sources
description: "The GND and Geonames as local data sources"
tags:
  - Data
  - Docker
  - DNB
  - Metadata
---

Even if it is not necessarily the intended use case, Docker makes it very easy to package large amounts of data with applications for simplified provisioning (such as APIs). This can be particularly helpful if, for example, standardisation data from different sources is to be merged for data enrichment.
<!--more-->

# GND

The [Gemeinsame NormDatei (GND)](https://www.dnb.de/EN/Professionell/Standardisierung/GND/gnd_node.html) contains information on persons, corporate bodies etc. that are deposited with the National Library.

The image is based on [Apache Jena](https://jena.apache.org/) and utilises the [HDT](https://www.rdfhdt.org/) dump. However, the necessary [module](https://github.com/rdfhdt/hdt-java) does not yet support Jena / Fuseki 5.0.

The container can be started easily:

```
docker run -it -p3030:3030 ghcr.io/cmahnke/data-containers/gnd:latest /bin/sh
```

After starting, the database can be conveniently searched in the browser: [http://localhost:3030/#/dataset/gnd/query](http://localhost:3030/#/dataset/gnd/query)

# GeoNames

[GeoNames](https://www.geonames.org/) contains a lot of information on many geographical entities, including coordinates, spelling variants and hierarchisation by area.

However, the container only contains the coordinates and spelling variants, e.g. to be able to retrieve the coordinates for a location. The data is uploaded to an [Apache Solr](https://solr.apache.org/) instance for this purpose and can be accessed after starting

```
docker run -p 8983:8983 -it ghcr.io/cmahnke/data-containers/geonames
```

Simply query with `curl` and the result is returned as JSON:

```
curl http://localhost:8983/solr/geonames/query?debug=query&q=n:G%C3%B6ttingen
```

# Further use

The commands for starting can also be combined / automated using `docker-compose`, e.g. together with tools for further analysis or enrichment.

The code is available on [GitHub](https://github.com/cmahnke/data-containers), the containers [here](https://github.com/cmahnke?tab=packages&repo_name=data-containers).
