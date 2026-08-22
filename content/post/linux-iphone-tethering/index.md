---
date: 2026-08-20T20:14:44+02:00
title: "Marode Infrastruktur"
tags:
- Linux
wikidata:
  - https://www.wikidata.org/wiki/Q2766
  - https://www.wikidata.org/wiki/Q381
  - https://www.wikidata.org/wiki/Q212607
  - https://www.wikidata.org/wiki/Q1246922
  - https://www.wikidata.org/wiki/Q314293
  - https://www.wikidata.org/wiki/Q14579
  - https://www.wikidata.org/wiki/Q802375
---

Heute war ich mit dem Zug zwischen Hannover, Paderborn und Göttingen unterwegs...
<!--more-->

Als jemand, der sonst fast nur mit dem ICE fährt, war ich erschüttert, wie schlecht die Fahrgast-Infrastruktur in der Fläche sein kann.
Nicht nur gibt es in diesem Bereich noch Funklöcher wie in den 2000er Jahren, auch sind Steckdosen und WLAN im Zug offenbar doch nicht so selbstverständlich, wie man erwarten sollte.

Besonders negativ fällt die Verbindung zwischen [Paderborn und Göttingen](https://de.wikipedia.org/wiki/Bahnstrecke_G%C3%B6ttingen%E2%80%93Bodenfelde) auf. Offensichtlich gibt es immer noch Funklöcher auf Bahnstrecken. Ich war ehrlich überrascht, dass für das (über die Jahre ausgedünnte) Regionalzugnetz im Personenverkehr keine 100-prozentige Netzabdeckung vorgeschrieben ist.

Natürlich gibt es kein WLAN und auch die Stromversorgung am Platz ist ein bekanntes Problem, nur leider wird der derzeitige Zustand noch bis Ende 2029 bestehen bleiben, Ab Ende 2025 wurde der Vertrag mit dem derzeitigen Betreiber, der [NordWestBahn](https://de.wikipedia.org/wiki/NordWestBahn) [ohne Ausschreibung verlängert](https://www.lok-report.de/news/deutschland/aus-den-laendern/54273-hessen-niedersachsen-nrw-vertragsverlaengerung-mit-der-nordwestbahn-zum-owl-dieselnetz-sued.html), da eine neu Ausschreibung absehbar nicht durchgeführt werden konnte. Warum man dann nicht zumindest um eine deutlich kürzere Laufzeit verlängern konnte, lies sich nicht feststellen.

## Moderne Technik ausgebremst von schlechter Infrastruktur

In diesem Artikel soll es aber eigentlich gar nicht um solche Infrastrukturprobleme gehen, sondern um ein Problem, das solche Lücken mit einem Linux-Laptop verursacht. Eigentlich denkt man, dass sich das fehlende WLAN über ein Mobiltelefon mit Hotspot-Funktionalität kompensieren lässt.  Und mit einem iPhone klappt das in der Regel auch ganz gut. Wenn man jedoch Linux nutzt und die Mobilfunkverbindung nicht stabil ist, kann man eine interessante Fehlerkaskade beobachten: Man fährt durch ein Funkloch und nicht nur die Verbindung bricht zusammen, sondern am Ende stellt der Hotspot seinen Dienst ein.
Auf dem Notebook erscheinen dazu folgende Meldungen:

```shell
$ sudo dmesg
Limiting TX power to 0 dBm as advertised by XX:XX:XX:XX:XX:XX
```

### Die lange Erklärung:
* Das iPhone verliert die Verbindung zum Mobilfunknetz.
* Das iPhone versucht, Energie zu sparen, und weist das Notebook an, die Signalstärke zu reduzieren (hier auf 0).
* Der Client folgt blind und setzt die Signalstärke auf Null, wodurch die Verbindung de facto gekappt wird.
* Das iPhone merkt, dass kein Client mehr verbunden ist, und deaktiviert die SSID, um noch mehr Energie zu sparen.
* Damit ist ein automatischer Reconnect erfolgreich ausgeschlossen, da der Client den Hotspot nicht mehr finden kann.

Nun kann man darüber streiten, auf wessen Seite das Problem liegt, aber die Meldung kommt aus dem Kernel-Modul `mac80211`. Leider half es auch nicht wirklich das Energiemanagement fürs WLAN zu deaktivieren. Hintergrund ist das "[Transmit Power Control/Management (TPC)](https://de.wikipedia.org/wiki/Transmitter_Power_Control)", das für [IEEE 802.11h-2003](https://de.wikipedia.org/wiki/IEEE_802.11a#Sendeleistung) definiert is. Demnach müssen WLAN-Geräte den Vorgaben eigentlich folgen, es gibt keine Untergrenze. Damit sieht der Standard streng genommen vor, dass er sein eigenes Funktionieren versagen darf.

Und warum passiert das z. B. mit Windows nicht? Weil es sich vermutlich nicht vom Access Point sagen lässt, dass er die Funktion einstellen soll. Das ist die einzig vernünftige Vorgehensweise für ein Client-Betriebssystem.

Letztendlich ist das also auch eine Form eines Infrastrukturdefizits...

### Lösung

Die Lösung ist recht einfach: Dem Kernel darf nicht mehr erlaubt werden, den Wert auf 0 zu setzen – selbst wenn dies vom AP "gefordert" wird:

```patch
--- a/mlme.c	2026-08-20 16:53:55.881324546 +0200
+++ b/mlme.c	2026-08-20 16:58:25.384436651 +0200
@@ -2164,7 +2164,12 @@

 		if (link->ap_power_level == new_ap_level)
 			return 0;
-
+		if (new_ap_level <= 0) {
+			sdata_dbg(sdata,
+				"Intercepting advertised deactivation (tried to limit TX power to %d dBm by %pM)\n",
+                          	new_ap_level, link->u.mgd.bssid);
+			new_ap_level = 12;
+		}
 		sdata_dbg(sdata,
 			  "Limiting TX power to %d dBm as advertised by %pM\n",
 			  pwr_level_cisco, link->u.mgd.bssid);

```

Die Lösung habe ich auch bei Github als [DKMS](https://de.wikipedia.org/wiki/Dynamic_Kernel_Module_Support)-Modul [bereitgestellt](https://github.com/cmahnke/sane-mac80211), die Installation ist recht einfach:

```shell
curl -fsSL https://cmahnke.github.io/sane-mac80211/repo-dist/public.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/sane-mac80211.gpg
echo "deb [signed-by=/etc/apt/keyrings/sane-mac80211.gpg] https://cmahnke.github.io/sane-mac80211/repo-dist/ ./" | sudo tee /etc/apt/sources.list.d/sane-mac80211.list
sudo apt update && sudo apt install sane-mac80211
```
