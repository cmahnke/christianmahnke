---
title: "Bewerbung Digitalkoordinator"
metaPage: true
displayinlist: false
theme: orange
archive: false
news: false
scss:
  - scss/orange.scss
  - scss/3d/3d-model.scss
js:
  - https://aframe.io/releases/1.5.0/aframe.min.js
  - https://unpkg.com/aframe-orbit-controls@1.3.2/dist/aframe-orbit-controls.min.js

---

{{< browser-banner browser="edge,firefox,safari" parent=".content-container" >}}

Diese Seite ist ein Prototyp und wird am besten in [Google Chrome](https://www.google.com/chrome/) angezeigt.
{{< /browser-banner >}}

# Virtuelle Ausstellung zur orangen Keramik

Orangene Glasuren für Keramiken sind vergleichsweise selten und dazu noch gewissen Moden unterworfen. Am bekanntesten sind die Phasen der 20er- / 30er-Jahre  (vereinfacht auch als Art Deco bezeichnet) und der 60er- / 70er-Jahre (meist als "Fat Lava" zusammengefasst).  

Früher wurden zur Erzeugung dieser Farben häufig [uranhaltige Glasuren](https://de.wikipedia.org/wiki/Uranglasur) verwendet.

Vermutlich auch begünstigt durch die Tatsache dass entsprechende Objekte Uran enthalten gibt es ein gewisses Interesse von Sammlern. Einige haben auch Präsenzen im Internet:

## Externe Seiten

* [Frank Pintschka: Uranglasuren und mehr...](http://frank-pintschka.de/3.html)

## Digitalisierung

Das Verfahren nennt sich [Photogrammetrie](https://de.wikipedia.org/wiki/Photogrammetrie), dabei wird ein 3D Modell (und die Textur) aus Einzelbildern aus verschiedenen Blickrichtungen rekonstruiert. Für jedes der gezeigten Exponate waren trotz der relative einfachen Geometrie und geringen (gezeigten) räumlichen Auflösung zwischen 50 und 70 Bilder notwendig.

## Präsentation

Die gezeigten Exponate lassen sich rotieren und Vergrößern, ebenfalls ist eine Vollbildanzeige möglich. Die Darstellung mittels VR-Brille konnte mangels entsprechender Ausstattung nicht getestet werden. Die Realisierung erfolgte prototypisch mit Hilfe der JavaScript Bibliothek [A-Frame](https://aframe.io/), daher sind kleinere Probleme wie verzehrte Perspektiven möglich.
Die Darstellung wurde mit Chrome und Safari getestet, in Firefox und Edge können die Objekte leicht gestaucht sein.

{{< browser-hide-selector browser="edge,firefox,safari" selector="[data-section='vase1']" >}}

# Exponate
