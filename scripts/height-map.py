#!/usr/bin/env python

import sys
from PIL import Image, ImageFilter, ImageOps
import numpy as np
import argparse, pathlib, json
from termcolor import cprint

unit = "mm"
default_dpi = 600

defaultImageSuffix = ".png"

def image_array(image):
    return np.array(image, dtype=int).tolist()

def filter(operations, image):
    for j in range(len(operations)):
        op = operations[j]
        if (isinstance(op, str)):
            name = op.upper()
        elif (isinstance(op, dict)):
            name = op['name'].upper()
        cprint("Applying filter {}".format(name), 'yellow')
        if ('params' in op):
            params = op['params']
            cprint("Using arguments {}".format(params), 'yellow')
        if (name == 'FIND_EDGES'):
            image = image.filter(ImageFilter.FIND_EDGES)
        elif (name == 'EDGE_ENHANCE'):
            image = image.filter(ImageFilter.EDGE_ENHANCE)
        elif (name == 'EDGE_ENHANCE_MORE'):
            image = image.filter(ImageFilter.EDGE_ENHANCE_MORE)
        elif (name == 'SMOOTH'):
            image = image.filter(ImageFilter.SMOOTH)
        elif (name == 'SMOOTH_MORE'):
            image = image.filter(ImageFilter.SMOOTH_MORE)
        elif (name == 'GRAYSCALE'):
            image = image.convert('L')
        elif (name == 'INVERT'):
            image = ImageOps.invert(image)
        elif (name == 'EQUALIZE'):
            image = ImageOps.equalize(image)
        elif (name == 'BINARIZE'):
            # Make sure that converted images are saved in a format that can store binary images (JPEG can't)
            if ('threshold' in params):
                threshold = params['threshold']
            else:
                threshold = 128
            image = image.point(lambda x : 255 if x > threshold else 0, mode='1')
        if (debug):
            debugFileName = args.image.parent.joinpath(args.image.stem + "-{}-filter_{}_{}".format(i, j, name) + defaultImageSuffix)
            cprint("Saving image {}".format(debugFileName), 'yellow')
            image.save(debugFileName)
    return image


parser = argparse.ArgumentParser(description='Create height map')
parser.add_argument('--image', type=pathlib.Path, help='Image to process', required=True)
parser.add_argument('--metadata', type=pathlib.Path, help='File containing metadata', required=True)
parser.add_argument('--pixel-size', type=int, help=f"Size of a pixel in {unit}", default=1)
parser.add_argument('--join', '-j', action='store_true', help='Join JSON fragments')
parser.add_argument('--output', choices=['json', 'png', 'webp'], action='append', nargs='+', help='Output format', default=[])
parser.add_argument('--debug', '-d', action='store_true', help='Create images for each filter step', default=False)
parser.add_argument('--resolution', '-r', type=int, default=600, help='Default DPI, currently needed for JXL')


args = parser.parse_args()

if str(args.image).endswith(".jxl"):
    import pyvips

    # Use sequential access for faster loading into memory
    vips_img = pyvips.Image.new_from_file(str(args.image), access='sequential')

    # libvips stores resolution in pixels per mm, multiply by 25.4 for DPI
    try:
        dpi_x = vips_img.xres * 25.4
        dpi_y = vips_img.yres * 25.4
    except Exception:
        dpi_x = 25.4
        dpi_y = 25.4

    # 1 pixel/mm is the libvips default if no metadata is present (25.4 DPI).
    # If it matches the default, we omit 'dpi' from info so the script's fallback logic applies.
    if abs(dpi_x - 25.4) >= 0.01 or abs(dpi_y - 25.4) >= 0.01:
        inImg_dpi = (dpi_x, dpi_y)
    else:
        inImg_dpi = None

    # Cast to 8-bit unsigned char to match standard PIL image behavior
    # (jxlpy typically loads as 8-bit, and thresholding logic assumes 8-bit)
    np_img = np.asarray(vips_img.cast("uchar"))

    if np_img.ndim == 2:
        inImg = Image.fromarray(np_img, mode='L')
    elif np_img.ndim == 3:
        bands = np_img.shape[2]
        if bands == 1:
            inImg = Image.fromarray(np_img[:, :, 0], mode='L')
        elif bands == 3:
            inImg = Image.fromarray(np_img, mode='RGB')
        elif bands == 4:
            inImg = Image.fromarray(np_img, mode='RGBA')
        else:
            inImg = Image.fromarray(np_img)
    else:
        inImg = Image.fromarray(np_img)

    if inImg_dpi is not None:
        inImg.info['dpi'] = inImg_dpi
else:
    inImg = Image.open(args.image)

if "dpi" in inImg.info:
    dpi = inImg.info['dpi']
    if (len(set(dpi)) > 1):
        cprint("Resolutions for x and y aren't equal!", 'red')
    dpi = dpi[0]
elif args.resolution:
    dpi = args.resolution
else:
    dpi = default_dpi

unit_divisors = {"mm": 25.4, "cm": 254, "inch": 1}
pixelPerMm = dpi * 1 / unit_divisors[unit]
cprint("Input DPI: {}, pixel per mmm: {}".format(dpi, pixelPerMm), 'yellow')
fragments = []

if (len(args.output) == 0):
    outputs = ['png']
else:
    outputs = sum(args.output, [])

if ('webp' in outputs) and not ('png' in outputs):
    defaultImageSuffix = ".webp"

debug = False
if (args.debug):
    debug = True
    cprint('Enabeling debug mode', 'yellow')
    cprint('Requested output formats: ' + ', '.join(outputs), 'yellow')

page = json.load(args.metadata.open())
metadata = page["fragments"]
if "defaults" in page and "filters" in page["defaults"]:
    default_filters = page["defaults"]["filters"]
else:
    default_filters = None
json_fragments = []
for i in range(len(metadata)):
    cprint("Processing image {} from file {}".format(i, args.image), 'yellow')

    left = metadata[i]['coords']['position']['x']
    top = metadata[i]['coords']['position']['y']
    right = metadata[i]['coords']['size']['x'] + metadata[i]['coords']['position']['x']
    bottom = metadata[i]['coords']['size']['y'] + metadata[i]['coords']['position']['y']
    name = metadata[i]['name']

    image = inImg.crop((left, top, right, bottom))
    if (debug):
        debugFileName = args.image.parent.joinpath(args.image.stem + "-{}-cut".format(i) + defaultImageSuffix)
        cprint("Saving image {}".format(debugFileName), 'yellow')
        image.save(debugFileName)
    if "filters" in metadata[i]:
        cprint("Using fragment specific filter", 'yellow')
        operations = metadata[i]['filters']
        image = filter(operations, image)
        applied_filters = operations
    elif default_filters is not None:
        cprint("Using page default filter", 'yellow')
        image = filter(default_filters, image)
        applied_filters = default_filters
    else:
        applied_filters = ""
    fragments.append({"position": {"left": left, "top": top, "right": right, "bottom": bottom}, "image": args.image, "filter": applied_filters})

    if (args.pixel_size != 0):
        width = round(image.size[0] / (pixelPerMm * args.pixel_size))
        height = round(image.size[1] / (pixelPerMm * args.pixel_size))
        cprint("Scaling image to width {}, height {}".format(width, height), 'yellow')
        image = image.resize((width, height))

    if ('png' in outputs):
        outFileName = args.image.parent.joinpath(args.image.stem + "-{}".format(i) + '.png')
        cprint("Saving image {}".format(outFileName), 'yellow')
        image.save(outFileName)
    if ('webp' in outputs):
        outFileName = args.image.parent.joinpath(args.image.stem + "-{}".format(i) + '.webp')
        cprint("Saving image {}".format(outFileName), 'yellow')
        image.save(outFileName)

    if ('json' in outputs):
        outFileName = args.image.parent.joinpath(args.image.stem + "-{}".format(i) + '.json')
        cprint("Saving image {}".format(outFileName), 'yellow')
        meta = {"scale": pixelPerMm, "unit": unit, 'x': left, 'y': top, "width": right - left, "height": bottom - top, "dpi": dpi}

        heightmap_fragment = {"name": name, "meta": meta, 'height': height, 'width': width, 'data': image_array(image)}
        json_fragments.append(heightmap_fragment)
        with open(outFileName, "w", encoding="utf-8") as file:
            file.write(json.dumps(heightmap_fragment))

if args.join and ('json' in outputs):
    outFileName = args.image.parent.joinpath(args.image.stem + '.json')
    cprint("Saving joined JSON {}".format(outFileName), 'yellow')
    with open(outFileName, "w", encoding="utf-8") as file:
        file.write(json.dumps(json_fragments))
