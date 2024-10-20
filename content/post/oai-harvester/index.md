---
date: 2023-04-16T19:58:44+02:00
title: "OAI-PMH Harvester"
keywords: OAI-PMH, Metadaten, CI, Daten Container
tags:
- Data
- Docker
---

Den millionsten OAI-PMH Harvester wollte ich nicht schreiben,...
<!--more-->

...daher habe ich einen [bestehenden](https://github.com/caseyamcl/phpoaipmh) genommen und als Docker Image [verpackt](https://github.com/cmahnke/oai-harvester-docker). Im Paket ist auch [Saxon](https://saxon.sourceforge.net/) enthalten um XML Metadatendateien weiterverarbeiten zu können...

Das Ganze kann verwendet werden um Daten automatisiert einem Docker Image hinzuzufügen.
