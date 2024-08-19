import os
import sys
import tempfile
import logging

from iiif.manipulator import IIIFManipulator

from PIL import Image

sys.path.append(os.path.join(os.path.dirname(__file__), "../themes/projektemacher-base/scripts"))

from PyUHDR import GainmapPreprocessing, UHDR, get_processors, save_yuv


class IIIFManipulatorUHDR(IIIFManipulator):

    tmpdir = "/tmp"
    filecmd = None
    pnmdir = None
    uhdr_args = ["contrast", "brightness", "pipeline", "config", "quality", "docker_client"]

    def __init__(self, **kwargs):
        super_args = {k: v for k, v in kwargs.items() if not k in self.uhdr_args }
        super(IIIFManipulatorUHDR, self).__init__(**super_args)
        self.compliance_level = 2
        self.image = None
        self.height = 0
        self.width = 0
        self.mime_type = None
        self.exif = None
        if "contrast" in kwargs:
            self.contrast = kwargs["contrast"]
        else:
            self.contrast = None
        if "brightness" in kwargs:
            self.brightness = kwargs["brightness"]
        else:
            self.brightness = None
        if "pipeline" in kwargs:
            self.pipeline = kwargs["pipeline"]
        else:
            self.pipeline = None
        if "config" in kwargs:
            self.config = kwargs["config"]
        else:
            self.config = None
        if "docker_client" in kwargs:
            self.docker_client = kwargs["docker_client"]
        else:
            self.docker_client = None


    def set_max_image_pixels(self, pixels):
        # Default is alway UHDR max
        if pixels < 32768 * 32768:
            pixels = 32768 * 32768
        Image.MAX_IMAGE_PIXELS = pixels

    # Loads the image
    def do_first(self):
        self.image = Image.open(self.srcfile)
        self.exif = self.image.getexif()
        w, h = self.image.size
        if (w % 2 or h % 2):

            new_w, new_h = self.image.size
            new_w -= w % 2
            new_h -= h % 2
            logging.info(f"Resizing image, from {w}x{h} to {new_w}x{new_h}")
            left = (w - new_w) // 2
            top = (h - new_h) // 2

            self.image = self.image.crop((left, top, new_w, new_h))

        self.logger.debug("Loaded image size %s", self.image.size)
        self.width, self.height = self.image.size

    def do_region(self, x, y, w, h):
        if x is None:
            self.logger.debug("Ignore crop without args")
        else:
            self.logger.debug("Croping at %dx%d to %dx%d", x, y, x + w, y + h)
            self.image = self.image.crop((x, y, x + w, y + h))
            self.width = w
            self.height = h

    def do_size(self, w, h):
        if w is None:
            self.logger.debug("Ignore scale without args")
        else:
            if w % 2:
                self.logger.info("Got scale request for uneven width (%d) - setting to %d", w, w + w % 2)
                w += w % 2
            if h % 2:
                self.logger.info("Got scale request for uneven height (%d) - setting to %d", h, h + h % 2)
                h += h % 2
            if w < 8:
                self.logger.info("Got scale request for width (%d) < 8 - setting to 8", w)
                w = 8
            if h < 8:
                self.logger.info("Got scale request for height (%d) < 8 - setting to 8", h)
                h = 8
            self.logger.debug("Scaling to %dx%d", w, h)
            self.image = self.image.resize((w, h))
            self.width = w
            self.height = h

    def do_rotation(self, mirror, rot):
        if not mirror and rot == 0.0:
            self.logger.debug("Ignoring rotation nop")
            return
        raise NotImplementedError(f"Rotation not implemented for { mirror}, {rot}!")

    def do_quality(self, quality):
        if quality in ("grey", "gray", "bitonal"):
            raise NotImplementedError("Bitonal and grey images not implemented!")
        self.logger.debug("Ignoring quality '%s'", quality)

    # This is the save method
    # pylint: disable=redefined-builtin
    def do_format(self, format):
        if format != "jpg" or format is None:
            raise NotImplementedError(f"Unsuported format: {format}!")
        if self.outfile is None:
            raise ValueError("Output file not set")
        w, h = self.image.size
        self.logger.debug("Saving fragment %dx%d format '%s' to %s", w, h, format, self.outfile)
        self.mime_type = "image/jpeg"
        if self.image is None:
            raise ValueError("No image to process!")
        uhdr = UHDR(self.image, metadata=self.exif, contrast=self.contrast, brightness=self.brightness, pipeline=self.pipeline, scale=True, config=self.config, docker_client=self.docker_client)
        uhdr.process(self.outfile)

    def cleanup(self):
        with self.image as i:
            i.close()
