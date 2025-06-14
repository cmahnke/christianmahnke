---
date: 2023-04-16T19:58:44+02:00
title: "OAI-PMH Harvester"
keywords: OAI-PMH, metadata, CI, data container
tags:
  - Data
  - Docker
  - Metadata
---

I didn't want to write the millionth [OAI-PMH harvester]([OAI-PMH Harvester](https://en.wikipedia.org/wiki/Open_Archives_Initiative_Protocol_for_Metadata_Harvesting))....
<!--more-->

...so I took an [existing](https://github.com/caseyamcl/phpoaipmh) and [packaged](https://github.com/cmahnke/oai-harvester-docker) it as a Docker image. The package also includes [Saxon](https://saxon.sourceforge.net/) to be able to process XML metadata files...

The whole thing can be used to automatically add data to a Docker image.
