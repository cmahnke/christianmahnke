---
date: 2025-11-27T18:33:44+02:00
title: "HDR IIIF for everyone with VIPS"
keywords: libultrahdr, ultrahdr, JPEGXL, vips
cite: true
tags:
  - DigitalImages
  - VIPS
  - HDR
  - IIIF
outputs:
- html
- iiif-manifest
wikidata:
  - https://www.wikidata.org/wiki/Q106239881
  - https://www.wikidata.org/wiki/Q7907037
  - https://www.wikidata.org/wiki/Q22682088
  - https://www.wikidata.org/wiki/Q11223506
---
HDR IIIF for everyone...
<!--more-->
...will be offered by the next version of VIPS. [John Cupitt](https://github.com/jcupitt) has now [added the functionality](https://github.com/libvips/libvips/pull/4745). This means that you no longer need your [own image tiler for HDR](/post/hdr-iiif/).

If you want to try it out now, you'll need to build the current development version yourself from the Git repository.

[`libultrahdr`](https://github.com/google/libultrahdr), a C compiler and `meson` must be installed. On MacOS with [`brew`](https://brew.sh/): `brew install meson libultrahdr`

If you need support for more image formats, [this file](https://github.com/libvips/libvips/blob/master/meson_options.txt) provides an overview of the available options.  Libraries that are already installed are usually found automatically; otherwise, additional libraries must be installed.

```
git clone --depth 1 https://github.com/libvips/libvips.git
cd libvips
meson setup build --prefix /usr/local -Duhdr=enabled
cd build
meson compile
meson test
sudo meson install
```

Then you can create IIIF pyramids for HTML with the following command:

```
vips dzsave $IMAGE_FILE $TARGET_DIR --keep gainmap --tile-size=512 --layout iiif
```

However, there is currently still a metadata entry missing in the `info.json` file to indicate that it is an HDR image. And the major viewers do not yet support the display either, more in the [old post](/post/hdr-iiif/).

With the upcoming version (8.18.0 - which should be released in one to two months), the functionality will then also be available via package managers...
