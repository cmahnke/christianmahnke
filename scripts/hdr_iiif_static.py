# Inspired by https://github.com/zimeon/iiif/blob/main/iiif_static.py

import os
import argparse
import logging
import pathlib
import sys
from math import floor

from io import StringIO

from PIL import Image

from iiif.static import IIIFStatic
from iiif.error import IIIFZeroSizeError

# from UhdrImagePlugin import check_uhdr
# from manipulator_uhdr_pillow import IIIFManipulatorUHDR
from manipulator_uhdr_app import IIIFManipulatorUHDR

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../../themes/projektemacher-base/scripts"))

from PyUHDR import get_processors

DEFAULT_LOG_LEVEL = logging.WARN

logger = logging.getLogger()


# TODO Finish this
def check_scale_factors(infile, tilesize):
    Image.MAX_IMAGE_PIXELS = 32768 * 32768
    image = Image.open(infile)
    size = image.size

    # logger.warning("Image process %s dimensions are %s, longest side %s", infile, size, max(size))

    multiplier = 1
    while max(size) >= tilesize * multiplier:
        tile = tilesize * multiplier
        # print(f"Size: {tile} {(size[0] // tile) * (size[1] // tile)}")
        tiles_width = floor(size[0] / tile)
        tiles_height = floor(size[1] / tile)
        print(f"Size: {tile}, width {tiles_width}, height {tiles_height}, total {tiles_width * tiles_height}, overlaps {size[0] - (tiles_width * tile)} {size[1] - (tiles_height * tile)}")

        multiplier *= 2

def manipulator_generator(uhdr_options):
    def uhdr_manipulator(**kwargs):
        return IIIFManipulatorUHDR(**uhdr_options, **kwargs)

    return uhdr_manipulator


def main(args):
    actions = get_processors()

    log_stream = StringIO()
    logging.basicConfig(stream=log_stream, level=logging.DEBUG)
    parser = argparse.ArgumentParser(description="Create a staic IIIF Image API directory and file structure")
    parser.add_argument("--input", "-i", action="store", type=pathlib.Path, required=True, help="Input file")
    parser.add_argument(
        "--output",
        "-o",
        action="store",
        type=pathlib.Path,
        default=".",
        help="Output directory",
    )
    parser.add_argument(
        "--tilesize",
        "-t",
        action="store",
        type=int,
        default=512,
        help="Tilesize in pixels",
    )
    parser.add_argument(
        "--api-version",
        "--api",
        "-a",
        action="store",
        default="2.1",
        help="API version, may be 1.1, 2.0 or 2.1",
    )
    parser.add_argument(
        "--prefix",
        "-p",
        action="store",
        default=None,
        help="URI prefix, to be used in info.json",
    )
    parser.add_argument(
        "--debug",
        "-d",
        action="store_true",
        help="Save processed video image",
        default=False,
        required=False,
    )
    parser.add_argument(
        "--check",
        "-c",
        action="store_true",
        help="Save processed video image",
        default=False,
        required=False,
    )

    parser.add_argument("--contrast", "-uc", help="contrast 0 to 2, default 1")
    parser.add_argument("--brightness", "-ub", help="brightness -1 to 1, default 0")
    parser.add_argument("--quality", "-q", help="JPEG quality", default=90)
    parser.add_argument("--json", "-j", help="JSON config")
    parser.add_argument(
        "--pipeline", "-up", nargs="+", choices=actions.keys(), help=f"Pipeline arguments, some of {', '.join(actions.keys())}"
    )

    args = parser.parse_args()

    if args.debug:
        print(log_stream.getvalue(), end="")
        logging.basicConfig(stream=sys.stdout, force=True)
    else:
        logger.setLevel(DEFAULT_LOG_LEVEL)

    if args.input:
        if args.input.exists():
            infile = str(args.input)
            if str(infile).endswith(".jxl"):
                if "jxlpy" not in sys.modules:
                    import jxlpy
                    from jxlpy import JXLImagePlugin
        else:
            print(f"File {str(args.input)} doesn't exist!")
            sys.exit(1)

    uhdr_options = {}

    if args.contrast:
        uhdr_options["contrast"] = args.contrast

    if args.brightness:
        uhdr_options["brightness"] = args.brightness

    if args.quality:
        uhdr_options["quality"] = args.quality

    if args.json:
        uhdr_options["config"] = args.json

    if args.pipeline is not None:
        uhdr_options["pipeline"] = args.pipeline

    print(check_scale_factors(infile, args.tilesize))

    if args.check:
        if check_uhdr(infile):
            logger.info("%s is a UHDR image!", infile)
            sys.exit(0)
        else:
            logger.warning("%s is not a UHDR image!", infile)
            sys.exit(1)

    generator = IIIFStatic(dst=args.output, tilesize=args.tilesize, api_version=args.api_version)
    #generator.manipulator_klass = IIIFManipulatorUHDR
    generator.manipulator_klass = manipulator_generator(uhdr_options)
    generator.generate(infile, identifier=args.prefix)


if __name__ == "__main__":
    main(sys.argv[1:])
