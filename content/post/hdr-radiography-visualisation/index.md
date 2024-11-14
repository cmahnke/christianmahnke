---
date: 2024-11-13T12:00:44+02:00
title: "HDR Bilder zur Visualisierung von Röntgendiagnostik"
keywords: Radiography, MET, Metropolitan Museum of Art, Paolo Veronese
tags:
  - DigitalImages
  - HDR
  - Art
---

Ein weiterer Anwendungsfall für HDR-Bilder...

<!--more-->

...ist die Visualisierung von röntgendiagnostischen Bildern alter Gemälde. Dieses spannende Verfahren wird eingesetzt, um z.B. Übermalungen, Korrekturen oder auch zugrundeliegende Zeichnungen "hinter" Bildern zerstörungsfrei sichtbar zum machen.

# Beispiel

Das [Metropolitan Museum of Art in New York](https://www.metmuseum.org/) stellt einige seine Highlights hochauflösend und teilweise auch in unterschiedlichen Wellenlängen unter freien Lizenzen zur Verfügung.

Das hier als Beispiel genutzte "Mars und Venus vereint durch Liebe" von [Paolo Veronese](https://de.wikipedia.org/wiki/Paolo_Veronese) von ca. 1578 ist beim Museum unter der Zugangsnummer 10.189 zu finden. Da es hier nur um eine mögliche Darstellung gehen soll, wird nicht weiter auf das Werk selbst eingegangen. Weitere ausführliche Informationen bietet das [Metropolitan Museum selbst](https://www.metmuseum.org/art/collection/search/437891).

Dieses Werk der Spätrenaissance zeigt im Röntgenbild einige auffällige Abweichungen von sichtbaren Licht. Dazu gehört eine geänderte Haltung des Kopfes der Venus und ein deutlicher Riss.

# Bearbeitungsschritte

Der erste Schritt ist die möglichst genaue Überlagerung des Ausgangsbildes und der Röntgenaufnahme, damit die weiteren Bildoperationen möglichst wenig Artefakte produzieren. Dabei stellte sich heraus, dass die Röntgenaufnahme minimal verzerrt ist.

Um die Unterschiede besser darstellen zu können, muss ein Graustufenderivat des Bildes im Bereich des sichtbaren Licht von der Röntgenaufnahme "abgezogen" werden. Das Ergebnis kann dann benutzt werden um die Farben in den hellen Bereichen zu verstärken.

Bereits in der Gainmap selbst sind schon der "alte" Kopf und Fuß sowie die überarbeitete Schulter deutlich erkennbar.

Die Ausgangsbilder und Bearbeitungsschritte:


{{< gallery >}}
[
  {"src": "img/step0-visible.jpg", "alt": "Konventionelle Aufnahme"},
  {"src": "img/step1-xray.jpg", "alt": "Röntgenaufnahme"},
  {"src": "img/step2-greyscale.jpg", "alt": "Graustufen sichtbaren Lichts"},
  {"src": "img/step3-gainmap.jpg", "alt": "Gainmap"}
]
{{</ gallery >}}

# Ergebnis

Das bisherige Ergebnis kann sicher noch optimiert werden, um eine bessere Auslöschung bei Überlappung von Röntgenaufnahme und Graustufenbild zu erreichen.

Achtung: Das Ergebnis ist ca. 14 Megabyte groß.

{{< gallery >}}
[
  {"src": "img/Mars and Venus United by Love.jpeg", "alt": "HDR Aufnahme mit Hervorhebungen"}
]
{{</ gallery >}}
