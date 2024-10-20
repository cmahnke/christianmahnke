---
date: 2022-11-27T08:33:44+02:00
title: "Hang pictures in Sweet Home 3D"
description: "A tool for hanging PDF posters in Sweet Home 3D"
tags:
  - 3D
  - Exhibition
  - Blender
---

For the planning of an [exhibition](/en/post/wilma-brauner/) using a 3D program, I have been looking into how pre-arranged picture frames could be imported into [Sweet Home 3D](https://www.sweethome3d.com/)...
<!--more-->

You would think that it should be pretty easy to import a file containing dimensions in exactly the size you want. Unfortunately Sweet Home 3D can't do that. So I made a Python script that remotely controls Blender to do this. It creates [COLLADA](https://en.wikipedia.org/wiki/COLLADA) files from JPEG or PDF files that can be imported into Sweet Home 3D.

The whole thing is also available as [Docker Image](https://github.com/cmahnke/oss-exhibition-tools):

```
docker run -it -v `pwd`:`pwd` ghcr.io/cmahnke/oss-exhibition-tools/image2model:latest --help
```

The following options are supported:

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
