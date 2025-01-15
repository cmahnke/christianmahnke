---
date: 2025-01-14T21:00:44+02:00
title: "Visualisierung von KI Segmentierung mit HDR"
description: "Buzzword Blendwerk"
keywords: Segmentatierung
tags:
  - DigitalImages
  - HDR
  - AI
preview:
  image: img/das-herrenjournal-7-1939-page015.jpeg
  hide: true
---

Der erste Schritt zu visuell unterstützter Annotierung mit HDR...
<!--more-->

... dient als weiterer Anwendungsfall für HDR.

# Beispiel

Um Werbung für meine anderen Blogs zu machen dient hier ein Beitrag aus dem Blaufußtölpel Mode Blog: [Das Herrenjournal Juli 1934](https://xn--blaufusstlpel-qmb.de/post/das-herrenjournal-7-1939/)

# Umsetzung

[Ultralytics](https://www.ultralytics.com/de) ermöglicht hier (mit Python) die Bildsegmentierung. Es ist ein sehr einfach zu nutzendes Framework mit vortrainierten Modellen, zusätzlich ermöglicht es natürlich Trainieren eigener Modelle...

Im Grunde reicht es, sich Bruchstücke aus der [Dokumentation](https://docs.ultralytics.com/tasks/segment/) zusammenzuklauben:

```python
import os
import numpy as np
from PIL import Image
from jxlpy import JXLImagePlugin
import cv2

from ultralytics import YOLO

image_path = "images/page015.jxl"

# Vorher Modell laden und ins richtige Verzeichnis legen
model_path = "./models/yolo11x-seg.pt"
model = YOLO(model_path)

image = Image.open(image_path)
results = model(image, verbose=False)
np_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
w, h = image.size

for result in results:
    names = result.names
    boxes = result.boxes
    masks = result.masks 
    if masks is None:
        continue
    for seg, box in zip(masks.data.cpu().numpy(), boxes):
        t = names[int(box.cls)]
        seg = cv2.resize(seg, (w, h))

```

Und schon hat man (mit `seg`) ein NumPy Array, das die Maske in den Abmessungen des Eingangsbilden enthält. Damit kann man dann weitere Bildoperationen durchführen...

Es müssen die folgenden Python Module installiert werden:

```bash
pip install jxlpy
pip install ultralytics
pip install opencv-python
```

Wobei `jxlpy` nicht notwendig ist, wenn man keine JXL Bilder nutzt.

Die Modelle können entweder direkt heruntergeladen und eingebunden werden, z.B. um damit direkt zu arbeiten, wie in dem Beispiel, oder über eine entsprechnde Konfiguration. Details bietet die verlinkte Dokumentation.

# Ergebnis

Das Bild zeigt die Umrisse der Frau in der Mitte (Klasse `person`) hervorgehoben.

Das bisherige Ergebnis kann sicher noch optimiert werden, was die Genauigkeit der Segmentierung angeht.

Achtung: HDR Ansicht nach dem Klick auf das Vorschaubild, ca 2MB groß.

{{< hdr-check >}}

{{< gallery >}}
[
  {"src": "img/das-herrenjournal-7-1939-page015.jpeg", "alt": "HDR Aufnahme mit Hervorhebungen"}
]
{{</ gallery >}}