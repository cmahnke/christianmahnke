---
date: 2026-08-20T20:14:44+02:00
title: "Poor infrastructure"
tags:
  - Linux
  - Travel
wikidata:
  - https://www.wikidata.org/wiki/Q2766
  - https://www.wikidata.org/wiki/Q381
  - https://www.wikidata.org/wiki/Q212607
  - https://www.wikidata.org/wiki/Q1246922
  - https://www.wikidata.org/wiki/Q314293
  - https://www.wikidata.org/wiki/Q14579
  - https://www.wikidata.org/wiki/Q802375
---

Today I was travelling by train between Hanover, Paderborn and Göttingen...
<!--more-->

As someone who otherwise travels almost exclusively by ICE, I was shocked at just how poor the passenger facilities can be in some areas.
Not only are there still areas with no mobile coverage in this region, just like in the 2000s, but power sockets and Wi-Fi on the train are apparently not as standard as one might expect.

The connection between [Paderborn and Göttingen](https://de.wikipedia.org/wiki/Bahnstrecke_G%C3%B6ttingen%E2%80%93Bodenfelde) stands out as particularly poor. There are evidently still areas with no mobile coverage on railway lines. I was honestly surprised that 100 per cent network coverage isn"t mandatory for the regional train network (which has been scaled back over the years) in passenger transport.

Of course, there is no Wi-Fi, and the power supply at seats is also a well-known problem; unfortunately, however, the current situation is set to remain in place until the end of 2029. From the end of 2025, the contract with the current operator, [NordWestBahn](https://de.wikipedia.org/wiki/NordWestBahn) [was extended without a tender process](https://www.lok-report.de/news/deutschland/aus-den-laendern/54273-hessen-niedersachsen-nrw-vertragsverlaengerung-mit-der-nordwestbahn-zum-owl-dieselnetz-sued.html), as it was foreseeable that a new tender could not be carried out. It could not be ascertained why the contract could not at least have been extended for a significantly shorter period.

## Modern technology held back by poor infrastructure

However, this article isn"t actually about such infrastructure problems, but rather about an issue caused by such gaps when using a Linux laptop. You"d think that the lack of Wi-Fi could be compensated for by using a mobile phone with hotspot functionality.  And with an iPhone, this usually works quite well. However, if you"re using Linux and the mobile connection isn"t stable, you may observe an interesting cascade of errors: you drive through a dead spot and not only does the connection drop, but eventually the hotspot stops working altogether.
The following messages appear on the laptop:

```shell
$ sudo dmesg
Limiting TX power to 0 dBm as advertised by XX:XX:XX:XX:XX:XX
```

**The long explanation:**
* The iPhone loses its connection to the mobile network.
* The iPhone attempts to save power and instructs the laptop to reduce the signal strength (in this case to 0).
* The client follows this instruction blindly and sets the signal strength to zero, effectively cutting off the connection.
* The iPhone detects that no client is connected and deactivates the SSID to save even more power.
* This effectively prevents an automatic reconnection, as the client can no longer find the hotspot.

Now, one could argue about whose fault the problem is, but the error message originates from the `mac80211` kernel module. Unfortunately, disabling power management for Wi-Fi didn"t really help either. The background to this is "[Transmit Power Control/Management (TPC)](https://de.wikipedia.org/wiki/Transmitter_Power_Control)", which is defined in [IEEE 802.11h-2003](https://de.wikipedia.org/wiki/IEEE_802.11a#Sendeleistung). According to this, Wi-Fi devices are actually required to comply with the specifications; there is no lower limit. Strictly speaking, the standard therefore allows for the possibility that it may fail to function as intended.

And why doesn"t this happen with Windows, for example? Because it presumably cannot be told by the access point to disable the function. That is the only sensible course of action for a client operating system.

So, ultimately, this is also a form of infrastructure deficit...

### Solution

The solution is quite simple: the kernel must no longer be allowed to set the value to 0 – even if this is "requested" by the AP:

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

I have also [made](https://github.com/cmahnke/sane-mac80211) the solution available on GitHub as a [DKMS](https://de.wikipedia.org/wiki/Dynamic_Kernel_Module_Support) module; installation is quite straightforward:

```shell
curl -fsSL https://cmahnke.github.io/sane-mac80211/repo-dist/public.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/sane-mac80211.gpg
echo "deb [signed-by=/etc/apt/keyrings/sane-mac80211.gpg] https://cmahnke.github.io/sane-mac80211/repo-dist/ ./" | sudo tee /etc/apt/sources.list.d/sane-mac80211.list
sudo apt update && sudo apt install sane-mac80211
```
