---
date: 2025-12-28T18:22:44+02:00
title: "Historische Stereogramme auf moderner Hardware"
description: "Das Apple Spatial Image Format"
keywords: "Stereoskopie, Anaglyphen"
cite: true
tags:
  - AI
  - 3D
  - DigitalImages
  - OpenCV
  - Stereoscopy
wikidata:
  - https://www.wikidata.org/wiki/Q35158
  - https://www.wikidata.org/wiki/Q484031
  - https://www.wikidata.org/wiki/Q24907733
  - https://www.wikidata.org/wiki/Q117715451
---

Ich habe ein neues Telefon...
<!--more-->

...mit einer neuen, interessanten Funktion, die mehrere meiner Steckenpferde verbindet. Digitale Bildformate und Stereoskopie / 3D.

Für die Mixed-Reality-Brille hat Apple das HEIC-Bildformat etwas erweitert. In einem Container werden nicht ein, sondern zwei leicht versetzt erstellte Bilder zusammen mit einigen Metadaten gespeichert. Diese Kombination sorgt beispielsweise in der Bildergalerie dafür, dass ein zusätzliches Icon erscheint, mit dem sich die räumliche Ansicht aktivieren lässt.

Bevor es um die langweiligen technischen Details geht, hier ein Beispiel mit einem historischen Stereogramm von der [VintageReality Seite](https://vintagereality.projektemacher.org/post/calcutta/). Oben rechts ist der Button für die räumliche Ansicht zu erkennen.

{{< video src="img/calcutta" >}}

## Realisierung

Das Ergebnis wurde durch die folgenden Schritte erzielt:

### HEIC-Bilder

Zunächst werden die Bilder aus den Scans der Karten extrahiert. Dazu wird das [Modell aus dem letzten Beitrag](/post/vintagereality-ai/) verwendet. Anschließend werden sie mittels OpenCV fast pixelgenau übereinandergelegt, die entstandenen Ränder werden wo möglich entfernt und die Helligkeit wird angeglichen.

Anschließend werden die beiden Halbbilder in einen HEIC-Container eingebettet, wofür das Python-Modul [`pillow_heif`](https://github.com/bigcat88/pillow_heif) verwendet wird.

### XMP-Metadaten

Die notwendigen Metadaten werden in XMP kodiert, vergleichbar mit alten (2024) UltraHDR-Implementierungen.

Die Elemente ligen im Namensraum `http://ns.apple.com/image/1.0/` (Bevorzugtes Präfix `apple`)

| Element | Typ | Beschreibung |
| :--- | :--- | :--- |
| `HorizontalFOV` | Real | Horizontales Sichtfeld in Grad. |
| `Baseline` | Real | Stereo-Basisabstand (Augenabstand) in Millimetern. |
| `HorizontalDisparityAdjustment` | Real | Faktor zur Anpassung der horizontalen Disparität (in der Regel ein Prozentsatz, z. B. 0,02). |
| `CameraModelType` | String | Der Projektionsmodelltyp. Verwendeter Wert: `SimplifiedPinhole`. |
| `CameraIntrinsics` | String | Intrinsische Kameraparameter als durch Leerzeichen getrennte Zeichenfolge: `f_pix 0 ppx 0 f_pix ppy 0 0 1`. |
| `CameraExtrinsicsRotation` | String | Rotationsmatrix als durch Leerzeichen getrennte Zeichenfolge (zeilenorientiert). Wert: `1 0 0 0 1 0 0 0 1` (Identität). |
| `CameraExtrinsicsPosition` | String | Positionsvektor in Metern als durch Leerzeichen getrennte Zeichenfolge `x y z`. Wert: `0 0 0`. |
| `StereoGroupIndex` | Integer | Index zur Identifizierung der Stereogruppe. Wert: `1`. |
{.even-table}

Viele dieser Werte sind (hier) geraten bzw. geschätzt, da sich exakte Werte für die alten verwendeten Kameras nicht ermitteln lassen:

| Parameter | Wert |
| :--- | :--- |
| Horizontales Sichtfeld | 45° |
| Augenabstand | 65mm |
| Disparität | 2% |

Die Disparität könnte sich theoretisch auch mit OpenCV über das Alignment ermitteln lassen, aber kleine Abweichungen fallen nicht ins Gewicht. Die restlichen Werte lassen sich aus den Schätzwerten und der Größe der Eingabebilder berechnen:

\[
\begin{aligned}
f\_pix &= \frac{width \cdot 0.5}{\tan(hfov_{rad} \cdot 0.5)} \\
ppx &= \frac{width}{2.0} \\
ppy &= \frac{height}{2.0} \\
\end{aligned}
\]

#### Weitere Informationen bei Apple Developer

* [Creating spatial photos and videos with spatial metadata](https://developer.apple.com/documentation/ImageIO/Creating-spatial-photos-and-videos-with-spatial-metadata)
* [Writing spatial photos](https://developer.apple.com/documentation/imageio/writing-spatial-photos)

### Metadaten injizieren

Am Schluss müssen noch die Metadaten in die Bilddatei injiziert werden. Das lässt sich nach etwas Konfiguration (für den Namespace und die Elemente) mit [`exiftool`](https://exiftool.org/) von Phil Harvey erledigen.

## Ergebnisse

Prinzipiell funktioniert das Verfahren, wobei die Ergebnisse für Innenräume deutlich besser sind als für Außenaufnahmen. Für Außenaufnahmen kann es jedoch hilfreich sein, die räumliche Staffelung der Bildebenen etwas zu stauchen.

Zum Ausprobieren können diese Dateien auf dem iPhone in der App "Fotos" gesichert werden.

* <a href="./img/calcutta.heic" title="Bilddatei" class="download-icon">Bilddatei</a>,  **Beitrag**: [Empfangssaal des Maharajah von Tangore in Calcutta, Indien](https://vintagereality.projektemacher.org/post/calcutta/)
* <a href="./img/neues-museum.heic" title="Bilddatei" class="download-icon">Bilddatei</a>, **Beitrag**: [Neues Museum - Gruppe des farnesischen Stiers](https://vintagereality.projektemacher.org/post/neues-museum/)
* <a href="./img/damascus.heic" title="Bilddatei" class="download-icon">Bilddatei</a>,  **Beitrag**: [Salon in the harem of a Mohammedan Pasha, Damascus](https://vintagereality.projektemacher.org/post/damascus/)
