---
date: 2024-06-06T11:33:44+02:00
title: "Kontrasterhöhung für UV Aufnahmen mittels HDR Darstellung"
keywords: UV, Ultraviolet, Bildanalyse, Northeim, Kopierbuch, Briefe
description: "Ein altes Kopierbuch aus Northeim als Beispiel für HDR Visualisierung von UV Aufnahmen"
preview:
  image: img/front.jpg
  hide: true
tags:
  - Light
  - Licht2024
  - DigitalImages
  - Object
---

In diesem Beispiel geht es um einen praktischen Anwendungsfall für die [HDR](https://de.wikipedia.org/wiki/High_Dynamic_Range_Image) Darstellung im Browser...
<!--more-->

Das Beispiel unten funktioniert derzeit nur mit Chrome-basierten Browsern (wie Edge oder Brave), da diese bereits HDR mit dem HTML Canvas Element funktioniert. Dafür gibt es zwei Gründe:
* Die Standardisierung ist noch in Gange
* Nicht alle Browser implementieren sofort neue Funktionen

Bei dem gezeigten Stück handelt es sich um einen Ausschnitt aus einem Kopierbuch aus der ersten Hälfte der 20er-Jahre.

Ein Kopierbuch ist eine Sammlung von kopierten Briefen in einem Buch. Dabei wurden diese Kopien nicht mittels eines Photokopierers erstellt, sondern mittels eines Kopierstiftes handgeschrieben, dann auf einer der Seidenpapierseiten gelegt, dabei die Vorder- und Rückseite mit einer Art Wachstuch eingeschlagen, um die anderen Seiten zu schützen und so gepresst. Dazu gab entweder entsprechende Pressen oder wie in diesem Fall, einen Gusseisernen "Schutzumschlag", der gleichzeitig die Presse ist.

Diese Kopierbuch gehörte Carl Spannaus aus Northeim, der im Verlauf des Buches offenbar auch als Korrespondent für den [Hannoverscher Kurier](https://de.wikipedia.org/wiki/Hannoverscher_Kurier) auftrat.

In der Ausgabe vom Sonntag, dem 14. September 1902 (Seite 5) des Hannoverscher Kurier ist er als Agent der Zeitung und Inhaber einer Buchhandlung in Northeim [genannt](https://digitale-sammlungen.gwlb.de/content/73496076X_HannoverscherKurier_19020914_01/pdf/00000005.pdf). Zusätzlich verlegt er auch [Postkarten](https://ansichtskarten-lexikon.de/verlag-carl-spannaus-northeim-i-hann-14621.html). Zusätzlich lässt sich im [Spiegel](https://www.spiegel.de/geschichte/ortstermin-a-946572.html) nachlesen, dass er der erste Northeimer in der NSDAP war...
Und im Börsenblatt des deutschen Buchhandels sind auch einige Einträge zu finden.

Dieses Buch enthält auch Kopien von Stempelabdrücken. Teilweise lässt sich die benutzte Stempelfarbe durch UV Strahlung anregen...

{{< gallery >}}
[
  {"src": "img/presse.jpg", "alt": "Presse"},
  {"src": "img/front.jpg", "alt": "Buchdeckel"},
  {"src": "img/page.jpg", "alt": "Seite"}
]
{{</ gallery >}}

# Beispiel

{{< hdr-canvas-check >}}

Wenn die HDR Überprüfung fehl geschlagen ist, werden die Farben nicht in voller Pracht angezeigt. **Selbst wenn die Darstellung von HDR Bildern funktioniert, mus die HDR Unterstützung für das `canvas` Element noch aktiviert werden: Dazu muss `enable-experimental-web-platform-features` auf `enabled` gesetzt werden. In Chrome kann die Einstellung über die URL "chrome://flags#enable-experimental-web-platform-features" angesteuert werden.**

Derzeit können nur die Intensitäten der einzelnen Kanäle angepasst werden, prinzipiell sind aber deutlich mehr Parametrisierungen denkbar.
Daher erhöht das Beispiel in den meisten Einstellungen die Lesbarkeit nur marginal, macht aber das Potential sichtbar.

{{< hdr-canvas image="img/sample.jpeg" >}}
