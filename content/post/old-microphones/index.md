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
---

Um perspektivisch auch mal Podcast zu machen, habe ich 2024 einiges an Audio-Equipment beschafft...
<!--more-->

...darunter auch einige alte Mikrofone und ein Audiointerface. Erstere sind leider in der Regel mit [Tuchelsteckern](https://de.wikipedia.org/wiki/Tuchelstecker) ausgestattet. Das Interface hat hingegen  [XLR](https://de.wikipedia.org/wiki/XLR)-Eingänge.

Das hübscheste Mikrofon, dass ich gefunden habe ist sicher das [Beyer Dynamic M55](https://www.radiomuseum.org/r/beyerdynam_m55_hn.html), ein dynamisches Tauchspulenmikrofon in einem Gehäuse aus gebürstetem Stahl.

{{< gallery >}}
[
  {"src": "img/front.jpg", "alt": "Vorderansicht"},
  {"src": "img/side.jpg", "alt": "Seitenansicht"},
  {"src": "img/plug.jpg", "alt": "Stecker"}
]
{{</ gallery >}}

Nach etwas Recherche stellte sich heraus, dass es potentiell [mehrere](https://heinrich-specht.de/articles/mikrofonstecker-und-stiftbelegungen/) [Belegungen für Mikrofon DIN-Stecker](http://www.elektron-bbs.de/elektronik/kabel/audio/din.htm) gibt. Hier kann dann ein Blick in den bestehenden Stecker (siehe Abbildung) helfen.

Nachdem man dann die angewendete Belegung identifiziert hat, kann man dann zum Lötkolben greifen und die Adern entsprechend an den Stecker löten. Für das Beyer M55 ist die Belegung recht simpel:
* Masse (durchsichtig) auf XLR Pin 1 und 3
* Signal (blau) auf XLR Pin 2

Die Abschirmung (Kupfer) kann man ignorieren, die Farben der Kabel gelten nur für dieses Mikrofon.

Man kann aber entsprechende Adapterkabel auch [kaufen](https://www.perakabel.de/din-stecker-3polig-auf-xlr-stecker-dap-lc-126-pin-1-an-2-masse-an-1-3.html).
