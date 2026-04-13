---
date: 2026-03-04T19:22:44+02:00
title: "Windows Remote Management"
tags:
  - Windows
  - Python
wikidata:
  - https://www.wikidata.org/wiki/Q975870
  - https://www.wikidata.org/wiki/Q840410
  - https://www.wikidata.org/wiki/Q107386415
  - https://www.wikidata.org/wiki/Q1423114
---

Viele Systeme zur Fernsteuerung von Windows-basierten Rechnern benötigen einen eigenen Client auf dem jeweiligen System....

<!--more-->

...Beispiele dafür sind die Änderung der Lautstärke einer Medienstation oder das Herunterfahren. Meist wird dies über [MQTT](https://de.wikipedia.org/wiki/MQTT) oder proprietäre Protokolle realisiert. Das macht das Setup jedoch unnötig kompliziert, insbesondere, wenn man versucht, die jeweiligen Systeme so wenig wie möglich anzupassen.

Wie beim [letzten Projekt zur Windows-Remoteinstallation](/post/windows-deployer/) gilt: Für Fälle, für die es keine Werkzeuge gibt, muss man man sich seine eigenen bauen:

Eine in Windows eingebaute Alternative dazu ist: [WMI (Windows Management Instrumentation)](https://de.wikipedia.org/wiki/Windows_Management_Instrumentation). Darüber lassen sich beispielsweise Prozesse starten. Gleichzeitig kann auch ein ([PowerShell](https://de.wikipedia.org/wiki/PowerShell)) Script übertragen werden.

Diese Kombination bietet viele Möglichkeiten, einen Windows-Client zu manipulieren, zumal es auch möglich ist, weitere Komponenten über [NuGet](https://de.wikipedia.org/wiki/NuGet)) nachzuladen.

Für die Umsetzung wird die Python-Bibliothek [impacket](https://github.com/fortra/impacket/) verwendet, die es ermöglicht, WMI ohne (Windows-) native Abhängigkeiten (also z. B. von Linux-Systemen aus) anzusprechen. Dafür muss lediglich der WMI-Dienst für den Zugriff von außen auf dem Client konfiguriert werden.

Das Skript (inklusive Docker-Image und REST-Service) ist auf [GitHub](https://github.com/cmahnke/mediastation-remote) verfügbar.
