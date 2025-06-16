---
date: 2025-01-26T19:15:44+02:00
title: 'Alte Mikrofone an neuer Hardware'
keywords: Mikrofon, Minituchel, XLR, Tuchelstecker, DIN, Beyer Dynamic M55
tags:
  - Audio
  - DIY
preview: img/side.jpg
wikidata:
  - https://www.wikidata.org/wiki/Q46384
  - https://www.wikidata.org/wiki/Q264997
---

In order to make podcasts in the future, I purchased some audio equipment in 2024...
<!--more-->

...including some old microphones and an audio interface. Unfortunately, the former are usually equipped with [Tuchel plugs](https://en.wikipedia.org/wiki/DIN_connector#Circular_connectors). The interface, on the other hand, has [XLR](https://en.wikipedia.org/wiki/XLR_connector) inputs.

The nicest microphone I found is definitely the [Beyer Dynamic M55](https://www.radiomuseum.org/r/beyerdynam_m55_hn.html), a dynamic moving coil microphone in a brushed steel housing.

{{< gallery >}}
[
  {"src": "img/front.jpg", "alt": "Front view"},
  {"src": "img/side.jpg", "alt": "Side view"},
  {"src": "img/plug.jpg", "alt": "Plug"}
]
{{</ gallery >}}

After a little research, it turned out that there are potentially [several](https://heinrich-specht.de/articles/mikrofonstecker-und-stiftbelegungen/) [assignments for microphone DIN plugs](http://www.elektron-bbs.de/elektronik/kabel/audio/din.htm). A look at the existing connector (see illustration) can help here.

Once you have identified the pin assignment used, you can use the soldering iron to solder the wires to the plug accordingly. The assignment for the Beyer M55 is quite simple:
* Ground (transparent) to XLR pin 1 and 3
* Signal (blue) to XLR pin 2

The shielding (copper) can be ignored, the colours of the cables only apply to this microphone.

However, you can also [buy](https://www.perakabel.de/din-stecker-3polig-auf-xlr-stecker-dap-lc-126-pin-1-an-2-masse-an-1-3.html) adapter cables.
