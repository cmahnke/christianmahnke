---
date: 2025-05-25T11:22:44+02:00
title: "Schlagwortpaare visualisiert"
scss: scss/tag-ring/tag-ring.scss
js:
  - ts/tag-ring/tag-ring.ts
tags:
  - Visualisation
  - Website
  - D3.js
---
Manchmal bringen Experimente nicht die gewünschten Ergebnisse...
<!--more-->

...auch in diesem Fall:

Da nach mehr als vier Jahren die Beiträge (inzwischen {{< post-count section="post" >}}) in diesem Blog langsam unübersichtlich werden, denke ich schon seit einiger Zeit darüber nach, wie man sie thematisch besser zugänglich machen kann.

Daher hier ein Versuch Paarungen von Schlagworten zu visualisieren.

<div id="chordContainer" class="tag-ring">
  <p style="text-align: center; color: #777">Lade Diagramm...</p>
</div>

Aber da das Ganze visuell nicht so gut funktioniert, wie erhofft, werden einige offensichtliche Schwächen nicht mehr ausgeräumt:
* Die Farben der Linen müssten sich über einen Gradienten ändern, wenn sie in den gegenüberliegenden Block laufen.
* Die Darstellung auf mobilen Endgeräten ist suboptimal
* Die Schlagworte sind nicht komplett übersetzt

Vielleicht wird es auch einfach Zeit für eine klassische Such-Funktion...
