---
date: 2024-09-05T11:33:44+02:00
title: "UV-Photogrammetrie"
keywords: Photogrammetrie, UV, UV-Photogrammetrie, Ultraviolet, Ultraviolet-Photogrammetrie, Uranglas
description: "3D Modell eines UV-Licht bestrahlten Uranglasobjekts"
preview:
  image: preview.png
  hide: true
class: uranium
cite: true
pagetheme: #5107b7
tags:
  - Light
  - Licht2024
  - DigitalImages
  - HDR
  - 3D
  - Three.js
  - Photogrammetry
  - Digitisation
wikidata:
  - https://www.wikidata.org/wiki/Q11391
  - https://www.wikidata.org/wiki/Q9128
  - https://www.wikidata.org/wiki/Q221163
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q980672
---

**In diesem Beitrag wird die weltweit erste HDR Darstellung einer UV-Photogrammetrie im Browser präsentiert.**
<!--more-->

# Uranglas

Da seit Jahren schon ab und zu [Uranglas](https://de.wikipedia.org/wiki/Uranglas) kaufe, wenn ich es günstig bekommen kann, habe ich inzwischen schon einer kleine Sammlung. Das wirklich faszinierende, ist die Bestrahlung mit UV-Licht: Dann wird das Glas zum leuchten angeregt. Der Effekt tritt auch schon mit dem UV-Anteil im Sonnenlicht auf, ist dann aber deutlich schwächer. Für das geübte Auge auf dem Flohmarkt allerdings meist ausreichend.

Da Uranglas ein beliebtes Sammelgebiet ist, hier ein paar weitere Informationen und Sammlungen:
* [Uranglas | Vom Sammler für Sammler](https://www.uranglas.ch/)
* [Radioaktivität zum Anfassen](https://www.radioaktivitaet-zum-anfassen.com/uranglas-mehr/photogalerie-urangl%C3%A4ser/)
* [J. Grzesina: Strahlend schöne Dinge](https://www.grzesina.de/radioakt/dinge.htm)
* Und natürlich lassen sich auch Stücke bei eBay usw. finden...

Da eines meiner technischen Interessengebiete ist, die digitale Vermittlung von Artefakten zu verbessern, hier ein Beispiel für eine solches Objekt unter UV-Bestrahlung. Dazu wurde das Objekt mittels Photogrammetrie erfasst, digital leicht nachbearbeitet und die Textur im Farbraum so verschoben, dass sie von einem HDR fähigen Browser angezeigt werden kann. Grundsätzlich funktioniert die Darstellung wie bei der [Vase aus dem Februar](/post/3d-model), nur die Aufnahmemethode und das Rendering der Textur unterscheiden sich. Letzteres erfordert allerdings (derzeit) einen Chrome-basierten Browser.

# Digitalisierung und Nachbearbeitung
Die Erstellung und Nachbereitung folgte [dem erprobtem Ablauf](/post/3d-models/), allerdings war deutlich mehr Nachbearbeitung notwendig, da bei der Aufnahme unter UV Licht deutlich mehr Schatten geworfen wurden. Ebenfalls wurden violette Reflexionen der UV Lampe entfernt.

# Präsentation

Die Umsetzung war einfacher als gedacht, es sind im Grunde nur zwei Schritte erforderlich. Für das Beispiel wurde eine angepasste Version von [Three.js](https://threejs.org/) verwendet.
* Erstellen eines GLTF Modells mit UltraHDR Textur, für das Konvertieren der Textur siehe [LibUltraHDR](/post/ultrahdr/). Die angepasste Textur muss im nächsten Schritt mit dem Modell zu einem Paket verpackt werden, dabei kommt [`obj2gltf`](https://github.com/CesiumGS/obj2gltf) zum Einsatz:

```
obj2gltf -i static/model/3DModel.obj -o static/model/uranium.glb
```

* Einen angepassten [Three.js Renderer](https://github.com/mrdoob/three.js/blob/master/examples/jsm/renderers/webgpu/WebGPURenderer.js), hier eine Variante des WebGPURenderers. Dieser wird benötigt um die Initialisierung des Canvas Elements kontrollieren und beeinflussen zu können. Dies selbst geschieht im [`WebGPUBackend`](https://github.com/mrdoob/three.js/blob/master/examples/jsm/renderers/webgpu/WebGPUBackend.js). Dabei sind die folgenden zusätzlichen Parameter bei der Initialisierung notwendig, weitere Informationen [hier](https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md#example-use):
```
colorSpace: "rec2100-hlg",
colorMetadata: { mode:"extended" }
```

Zusätzlich sollte die UltraHDR Textur ohne zusätzliche Beleuchtung angezeigt werden, da ansonsten die Beleuchtung zu Umrechnungen er Farbigkeit der Textur führt.

# Beispiel

{{< hdr-canvas-check >}}

Wenn die HDR Überprüfung fehl geschlagen ist, werden die Farben nicht in voller Pracht angezeigt. **Selbst wenn die Darstellung von HDR Bildern funktioniert, mus die HDR Unterstützung für das `canvas` Element noch aktiviert werden: Dazu muss `enable-experimental-web-platform-features` auf `enabled` gesetzt werden. In Chrome kann die Einstellung über die URL "chrome://flags#enable-experimental-web-platform-features" angesteuert werden.**

{{< hdr-model model="model/uranium.glb" >}}

# Update für Three.js R167

Nach dem Update auf Three.js R167 ist eine weitere Anpassung des Models notwendig. Da das Modell nicht beleuchtet werden darf, damit die Textur nicht durch Shading "eingefärbt" werden darf, muss der Typ des Materials auf `MeshBasicMaterial` geändert werden.
