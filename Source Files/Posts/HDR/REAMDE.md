# HDR Drafts

## segment.py

Creates a segmented mask from an image. Set `image_path`, `mode` (possible are `mask`, `gainmap` and anything else), `highlight_shape` (the shape number to be extracted / highligted) and `out_file_name`.

Run something like:
```
convert images/page015.jxl input.jpeg
ffmpeg -y -i mask.jpg -filter:v format=p010 mask.yuv
ultrahdr_app -m 0 -p mask.yuv -i input.jpg -w 1438 -h 1920 -a 0 -M 0 -k 1 -K 3
```

Use `-k`and `-K` to limit HDR range

To scale images to even dimensions:
```
magick mask.jpg -resize 25% -crop "%[fx:w-w%2]x%[fx:h-h%2]+0+0" maskC.jpg
```

Resize only:
```
magick input.jpg -resize 25% output.jpg 
```