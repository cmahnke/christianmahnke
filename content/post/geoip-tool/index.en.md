---
date: 2023-04-30T16:15:44+02:00
title: "GeoIP Tool"
desscription: "A tool to add your own coordinates for IP addresses to an ElasticSearch index, for indoor navigation"
keywords: IP, Go, Golang, Geolocalisation, ElasticSearch
cite: true
tags:
  - Data
  - Geodata
  - Search
wikidata:
  - https://www.wikidata.org/wiki/Q37227
  - https://www.wikidata.org/wiki/Q11135
  - https://www.wikidata.org/wiki/Q916335
---

[Kibana](https://www.elastic.co/de/kibana) visualisation with room plans needs data, e.g. from devices in a building. But the data has to come from somewhere...
<!--more-->

One way to do this is simply to use the [GeoIP processor](https://www.elastic.co/guide/en/elasticsearch/reference/current/geoip-processor.html) from Elastic Search. Unfortunately, it is not possible to create your own database with the supplied on-board tools. I have therefore written a [small tool](https://github.com/cmahnke/geoip-tool) for this purpose.

The tool can be used to create a database that assigns the coordinates of devices within a building to a log entry during indexing, for example. Examples of its use can be found at [GitHub](https://github.com/cmahnke/geoip-tool).
