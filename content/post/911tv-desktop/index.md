---
date: 2024-10-09T19:22:44+02:00
displayinlist: false
archive: false
news: false
title: "911TV als Desktop Anwendung"
preview:
  image: 911tv-mac.png
  hide: true
tags:
- Website
- HybridMedia
- Archives
- JavaScript
- Electron
---

Wieder ein Corona Projekt:

<!--more-->

Diesmal bin ich selber betroffen. Das gab mir die Möglichkeit ein Projekt aus dem [letzten Herbst](https://christianmahnke.de/post/911tv/) etwas zu renovieren:

[911TV](https://911tv.projektemacher.org/) war im letzten November "fertig" - es tat grob, was es sollte, aber es gab auch noch kleinere Probleme und weitere Ideen. Die Probleme sind nun bedeutend weniger geworden, besonders bei mobilen Clients. Und es gibt die Seite nun auch als Anwendung für den Desktop:

{{< figure src="911tv-mac.png" alt="Screenshot 911TV Desktop Mac" caption="Screenshot 911TV Desktop auf MacOS" >}}

Die Verfügbarkeit als Desktop App lässt auch eine Bereitstellung als Medienstation, also einer Art von physischer Installation näher rücken. Alleine schon weil diese einfacher handhab- und verteilbar sind als Webseiten in einem Browser (keine zusätzlichen Einstellungen für Lockdown / Kiosk Modi, kein Management von Medienhandling).


## Technische Realisierung

Die Anwendung ist [Electron](https://www.electronjs.org/) realisiert und daher prinzipiell für Windows, Linux und MacOS verfügbar. Derzeit wird die MacOS Variante allerdings nicht automatisch erstellt.
Ansonsten hat sich nicht viel an der Implementierung geändert, einige Module wurde auf [TypeScript](https://www.typescriptlang.org/) umgestellt und mein nächstes Projekt wird sicher nicht mit dem [React](https://react.dev/) Framework gemacht.

## Download (aktualisiert)

* **Windows**
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Installer 64 Bit Intel / ARM]()
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Zip 64 Bit Intel]()
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Zip64 Bit ARM]()

* **Linux**
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Tar.gz 64 Bit Intel]()
  * {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Tar.gz 64 Bit ARM]()

Die Anwendung kann bei [GitHub heruntergeladen](https://github.com/cmahnke/911tv/releases) werden.
