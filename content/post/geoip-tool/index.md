---
date: 2023-04-30T16:15:44+02:00
title: "GeoIP Tool"
desscription: "Ein Werkzeug um eigene Koordinaten für IP Adressen zu einem ElasticSearch Index hinzuzufügen, z.B. zur Indoor Navigation"
keywords: IP, Go, Golang, Geolokalisierung, ElasticSearch
tags:
  - Data
---

[Kibana](https://www.elastic.co/de/kibana) Visualisierung mit Raumplänen braucht Daten, z.B. von Geräten in einem Gebäude. Aber irgendwo müssen die Daten herkommen...
<!--more-->

Eine Möglichkeit das zu tun ist einfach den [GeoIP Prozessor](https://www.elastic.co/guide/en/elasticsearch/reference/current/geoip-processor.html) von Elastic Search dafür zu benutzen. Leider ist es mit mitgelieferten Bordmittel nicht möglich eine eigene entsprechende Datenbank anzulegen. Daher habe ich dafür ein [kleines Werkzeug](https://github.com/cmahnke/geoip-tool) geschrieben.

Mit dem Tool kann man eine Datenbank anlegen, die die Koordinaten von Geräten innerhalb eines Gebäudes schon bei der Indexierung z.B. einem Log Eintrag zuweist. Beispiele zur Nutzung finden sich bei [GitHub](https://github.com/cmahnke/geoip-tool).
