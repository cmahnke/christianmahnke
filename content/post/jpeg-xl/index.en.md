---
date: 2021-04-17T11:22:44+02:00
title: "JPEG XL"
tags:
- DigitalImages
- Projektemacher.org
- IIIF
iiifContext: http://iiif.io/api/presentation/2/context.json
outputs:
- html
- iiif-manifest
resources:
- src: "front.jxl"
  params:
    iiif: front/info.json
    hint: non-paged
    label: Front
- src: "back.jxl"
  params:
    iiif: back/info.json
    hint: non-paged
    label: Back
---

Since my blogs are managed on GitHub, the images have to be stored as storage-saving as possible...
<!--more-->

# Why JPEG XL?
[JPEG XL](https://en.wikipedia.org/wiki/JPEG_XL) is a new format for raster images, in fact, is's so recent (at the time this text was written) there haven't even been an entry in the German Wikipedia.

You can read there what exactly JPEG XL does differently or better than the well-known JPEG. We limit ourselves here to the advantages for the Projektemacher blogs:
* Less storage space required
* Lossless compression available

Disadvantages are currently:
* Few programs can handle it
* The existing algorithms are not yet optimized - it is slower

The reference implementation can be found on [GitLab](https://gitlab.com/wg1/jpeg-xl).

# How?

Since the conversion to IIIF derivatives on GitHub is done by a [Docker image](https://github.com/cmahnke/iiif-action), the easiest way to integrate the use of the new format into the tool chain is to add JPEG XL support to this image. For the used [LibVIPS](https://github.com/libvips/libvips) there is a [Pull Request](https://github.com/libvips/libvips/pull/2181), which supports the JPEG XL reference implementation. This is now built into a variant of the image for conversion:

```
docker pull ghcr.io/cmahnke/iiif-action:latest-jxl
```

# Preparations

## Start an interactive container

The image can also be used to create the source files.

```
docker run -it -v ${PWD}:${PWD} 'ghcr.io/cmahnke/iiif-action:latest-jxl' /bin/bash -c "cd ${PWD}; $SHELL"
```

## File conversion

Using `vips` directly has the advantage that you can use any supported input file format.

```
vips copy front.tif front.jxl[Q=100]
```

The following issues have been discovered:

* `vips jxlsave` does not support parameters
* The parameter `effort` can lead to a crash if it is greater than `7` - might be a memory problem, not yet tested with `cjxl`

`cjxl` can also be used, but you should use a losslessly compressed (e.g. PNG) input file:

```
cjxl front.png front.jxl
```

The possible options are linked here:
* [`vips jxlsave`](https://github.com/libvips/libvips/blob/add-jxl/libvips/foreign/jxlsave.c)
* [`cjxl`](https://gitlab.com/wg1/jpeg-xl/-/blob/master/doc/man/cjxl.txt)

## Options

Since the use of JPEG XL is primarily intended here to reduce the storage requirement and with the same or higher quality, it is important to take this into account during the conversion. If possible, the processed master images (i.e. uncompressed image data) should be used directly to create the derivatives. JPEG files (ImageMagick quality level 95) are currently the source material for creating IIIF derivates.

[`butteraugli`](https://github.com/google/butteraugli) is used to assess the quality.

### Generate comparison file

```
convert front.tif -quality 95 front.jpg
```

`butteraugli` can read JPEG or PNG files.

## Results

This post does not claim to achieve the most optimal results. In addition, the JPEG XL encoder is very memory-hungry and can therefore not be fully tried out in the Docker environment. For these reasons there are no benchmarks, comparisons of file sizes, etc.

Basically what was known at the beginning remains: files are smaller with a similar quality.

# IIIF

After you have created a few JPEG XL files, you can now generate IIIF derivatives:

```
vips dzsave front.jxl front -t 512 --layout iiif
```

{{< iiif/mirador manifestUrl="manifest.json" >}}
