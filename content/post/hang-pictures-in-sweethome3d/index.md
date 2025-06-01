---
date: 2022-11-27T08:33:44+02:00
title: "Bilder aufhängen in Sweet Home 3D"
keywords: Sweet Home 3D, PDF, Inkscape, 3D Model
description: "Ein Werkzeug um PDF Plakate in Sweet Home 3D aufzuhängen"
cite: true
tags:
  - 3D
  - Exhibition
  - Blender
---

Für die Planung einer [Ausstellung](/post/wilma-brauner/) in 3D habe ich mich damit beschäftigt, wie vorarrangierte Bilderrahmen in [Sweet Home 3D](https://www.sweethome3d.com/) importiert werden könnten...
<!--more-->

Man sollte meinen, das es ziemlich einfach sein sollte, eine Datei, die Abmessungen enthält, in genau der Größe zu importieren. Leider kann Sweet Home 3D das nicht. Daher habe ich ein Python Script, dass Blender dafür fernsteuert, gebastelt. Es erzeugt aus JPEG oder PDF Dateien [COLLADA](https://en.wikipedia.org/wiki/COLLADA) Dateien, die in Sweet Home 3D importiert werden können.

Das Ganze ist auch als [Docker Image](https://github.com/cmahnke/oss-exhibition-tools) verfügbar:

```
docker run -it -v `pwd`:`pwd` ghcr.io/cmahnke/oss-exhibition-tools/image2model:latest --help
```

Die folgenden Parameter werden dabei unterstützt:

```
usage: generate-models.py [-h] (-i [file] | -d [directory] | -s) [-o [directory]] [-z] [-t] [-k] [-p PATTERN]

Generate Collada files from images

options:
  -h, --help            show this help message and exit
  -i [file], --input [file]
                        File to convert
  -d [directory], --directory [directory]
                        Path to collect images from
  -s, --setup           Ensure all required modules are present
  -o [directory], --output [directory]
                        Path to write converted files to
  -z, --zip             Compress results to zip file
  -t, --thumbs          Use thumbnails as textures
  -k, --keep            Keep generated files
  -p PATTERN, --pattern PATTERN
                        File pattern for directories, default is '**/*.jpg,**/*.pdf'

```
