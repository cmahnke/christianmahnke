---
date: 2024-10-09T19:22:44+02:00
title: "911TV als Desktop Anwendung"
description: "Eine Webseite als Medieninstallation am Beispiel von 911TV"
preview:
  image: 911tv-mac.png
  hide: true
tags:
- Website
- Electron
- HybridMedia
- Archive
- JavaScript
- MediaInstallation
wikidata:
  - https://www.wikidata.org/wiki/Q10806
---

Ich hatte Zeit, da ich krank war:

<!--more-->

Diesmal bin ich selber betroffen. Das gab mir die Möglichkeit ein Projekt aus dem [letzten Herbst](https://christianmahnke.de/post/911tv/) etwas zu renovieren:

[911TV](https://911tv.projektemacher.org/) war im letzten November "fertig" - es tat grob, was es sollte, aber es gab auch noch kleinere Probleme und weitere Ideen. Die Probleme sind nun bedeutend weniger geworden, besonders bei mobilen Clients. Und es gibt die Seite nun auch als Anwendung für den Desktop:

{{< figure src="911tv-mac.png" alt="Screenshot 911TV Desktop Mac" caption="Screenshot 911TV Desktop auf MacOS" >}}

Die Verfügbarkeit als Desktop App lässt auch eine Bereitstellung als Medienstation bzw. -installation, also einer Art von physischer Installation näher rücken. Alleine schon weil diese einfacher handhab- und verteilbar sind als Webseiten in einem Browser (keine zusätzlichen Einstellungen für Lockdown / Kiosk Modi, kein Management von Medienhandling).


## Technische Realisierung

Die Anwendung ist [Electron](https://www.electronjs.org/) realisiert und daher prinzipiell für Windows, Linux und MacOS verfügbar. Derzeit wird die MacOS Variante allerdings nicht automatisch erstellt.
Ansonsten hat sich nicht viel an der Implementierung geändert, einige Module wurde auf [TypeScript](https://www.typescriptlang.org/) umgestellt und mein nächstes Projekt wird sicher nicht mit dem [React](https://react.dev/) Framework gemacht.

## Download (aktualisiert)

* **Windows**
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Zip 64 Bit Intel](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-win-x64.zip)
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Zip 64 Bit ARM](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-win-arm64.zip)

* **Linux**
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Tar.gz 64 Bit Intel](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-linux-amd64.tgz)
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Tar.gz 64 Bit ARM](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-linux-arm64.tgz)

Die Anwendung kann bei [GitHub heruntergeladen](https://github.com/cmahnke/911tv/releases) werden.
