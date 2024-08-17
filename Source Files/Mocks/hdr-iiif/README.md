IIIF HDR
========

# Converting to a test image


Important: make sure, that the dimensions of the image are even, add something like `-gravity center -crop 12544x11944+0+0`
```
convert img/front.hdr.jxl -quality 10 img/front-lowq.jpg
ffmpeg -i front-lowq.jpg -filter:v format=p010 output.yuv
docker run -i -v "`pwd`":"`pwd`" -w "`pwd`" ghcr.io/cmahnke/hdr-tools:latest /usr/bin/ultrahdr_app -m 0 -p output.yuv -i input.jpg -w 12544 -h 11944 -a 0
```

# Dependencies
```
python -m pip install -r requirements.txt
```

# Testing UltraHDR decode

For a working image:
```
docker run -i -v "`pwd`":"`pwd`" -w "`pwd`" ghcr.io/cmahnke/hdr-tools:latest /usr/bin/ultrahdr_app -m 1 -j img/white-hdr.jpeg -O 4 -o 0
```

```
docker run -i -v "`pwd`":"`pwd`" -w "`pwd`" ghcr.io/cmahnke/hdr-tools:latest /usr/bin/ultrahdr_app -m 1 -j img/generated-uhdr.jpeg  -o 1 -O 5
```

# Create test image

```
convert -size 32x32 canvas:white -colorspace ycbcr img/white.jpg
ffmpeg -i img/white.jpg -filter:v format=p010 img/white.yuv
docker run -i -v "`pwd`":"`pwd`" -w "`pwd`" ghcr.io/cmahnke/hdr-tools:latest /usr/bin/ultrahdr_app -m 0 -p img/white.yuv -i img/white.jpg -w 32 -h 32 -a 0
```

# Running the converter / enhancer

It's possible to try brightness (`-b`), contrast (`-b`) and preprocessing pipeline (`-p`).

```
/opt/homebrew/bin/python3 scripts/enhance_image.py -i img/front.jxl -o front-hdr.jpg -b -0.2 -p grayscale invert
```

# Running image tiler

```
/opt/homebrew/bin/python3 scripts/hdr_iiif_static.py -d -i img/front.jxl
```
