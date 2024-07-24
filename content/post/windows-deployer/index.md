---
date: 2023-08-21T19:22:44+02:00
title: "Windows Deployer"
tags:
  - Windows
---

Wie installiert man eine frisch gebaute Software von GitLab / GitHub?
Auf einem Windows-Rechner.
In einem internen Netz - hinter einem VPN Gateway
<!--more-->

Für Fälle, für die es keine Werkzeuge gibt, muss man sich seine eignen bauen:
Das erste Problem ist das Remote-Deployment auf Windows-Rechnern (von Linux aus). Es gibt verschiedene Ansätze wie z.B. [WMI](https://de.wikipedia.org/wiki/Windows_Management_Instrumentation), aber diese sind nicht immer direkt auf anderen Plattformen verfügbar. So ist zwar PowerShell auch für Mac OS und Linux verfügbar, aber nur mit einer Untermenge der Features. Auch existiert ein anderer [WMI Client für Linux](https://gist.github.com/rickheil/7c89a843bf7c853997a1), aber dieser hat ein Problem mit Windows 10. Manche Bibliothek laufen nur auf Windows, da sie einfach Wrapper um die Infrastruktur des Betriebssystems sind.

Am Ende fiel die Wahl auf die Python Bibliothek [`impacket`](https://github.com/fortra/impacket), da diese aktiv gepflegt wird und umfangreiche Beispiele mitbringt.

Über WMI können [Windows Installer Pakete (MSI)](https://de.wikipedia.org/wiki/Windows_Installer) installiert werden, diese Pakete können auch mit dem Open Source Projekt [`msitools`](https://gitlab.gnome.org/GNOME/msitools) erstellt werden - daher ist ein entsprechendes Docker Image auch dabei.

Das zweite Problem ist der Zugang zu einem System in einem internen Netz. Da es aber einen Cisco VPN Gateway gibt, kann für den Zugang [`openconnect`](https://gitlab.com/openconnect/openconnect) und [`vpnc-scripts`](https://gitlab.com/openconnect/vpnc-scripts) genutzt werden. Das funktioniert auf für Docker Container, wenn man beim Start eine entsprechende  Netzwerkkonfiguration (für `/dev/net/tun`) angibt.

Ein weiteres, leicht zu lösendes, Problem war die Bereitstellung der zu installierenden Datei. Dafür kann einfach [Samba](https://www.samba.org/) verwendet werden.

Um das Zusammenspiel all dieser Faktoren einfacher zu gestalten, wurden die Subsysteme als Docker images verpackt. Dies hat auch den Vorteil, dass die Komponenten relativ einfach im Rahmen eines GitLab / Github Workflows verwendet werden können.

Das Ergebnis und viele weitere Details der Umsetzung sind [https://github.com/cmahnke/windows-deployer](hier) zu finden.
