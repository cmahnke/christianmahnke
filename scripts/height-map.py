#!/usr/bin/env python

from PIL import Image, ImageFilter, ImageOps
import numpy as np
import argparse, pathlib, json
from termcolor import cprint

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
            debugFileName = args.image.parent.joinpath(args.image.stem + "-{}-filter_{}_{}".format(i, j, name) + '.png')
            cprint("Saving image {}".format(debugFileName), 'yellow')
            image.save(debugFileName)
    return image


parser = argparse.ArgumentParser(description='Create height map')
parser.add_argument('--image', type=pathlib.Path, help='Image to process', required=True)
parser.add_argument('--metadata', type=pathlib.Path, help='File containing metadata', required=True)
parser.add_argument('--pixel-size', type=int, help='Size of a pixel in mm', default=1)
parser.add_argument('--output', choices=['json', 'png'], action='append', nargs='+', help='Output format', default=[])
parser.add_argument('--debug', '-d', action='store_true', help='Create images for each filter step', default=False)

args = parser.parse_args()

inImg = Image.open(args.image)
dpi = inImg.info['dpi']
if (len(set(dpi)) > 1):
    cprint("Resolutions for x and y aren't equal!", 'red')
dpi = dpi[0]
pixelPerMm = dpi * 1 / 25.4
cprint("Input DPI: {}, pixel per mmm: {}".format(dpi, pixelPerMm), 'yellow')
fragments = []


if (len(args.output) == 0):
    outputs = ['png']
else:
    outputs = sum(args.output, [])

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
for i in range(len(metadata)):
    cprint("Processing image {} from file {}".format(i, args.image), 'yellow')

    left = metadata[i]['coords']['position']['x']
    top = metadata[i]['coords']['position']['y']
    right = metadata[i]['coords']['size']['x'] + metadata[i]['coords']['position']['x']
    bottom = metadata[i]['coords']['size']['y'] + metadata[i]['coords']['position']['y']

    image = inImg.crop((left, top, right, bottom))
    if (debug):
        debugFileName = args.image.parent.joinpath(args.image.stem + "-{}-cut".format(i) + '.png')
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
    if ('json' in outputs):
        outFileName = args.image.parent.joinpath(args.image.stem + "-{}".format(i) + '.json')
        cprint("Saving image {}".format(outFileName), 'yellow')
        meta = {"scale": pixelPerMm, "width": right - left, "height": bottom - top, "dpi": image.info['dpi']}
        json.dump({"meta": meta, 'height': height, 'width': width, 'data': image_array(image)}, open(outFileName, 'w'))
        #for h in range(height):
        #    for w in range(width):
        #        image.getpixel((0,0))
