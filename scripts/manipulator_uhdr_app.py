import os
import sys
import tempfile

from iiif.manipulator import IIIFManipulator

from PIL import Image

sys.path.append(os.path.join(os.path.dirname(__file__), "../themes/projektemacher-base/scripts"))

from PyUHDR import GainmapPreprocessing, UHDR, get_processors, save_yuv


class IIIFManipulatorUHDR(IIIFManipulator):

    tmpdir = "/tmp"
    filecmd = None
    pnmdir = None
    uhdr_args = ["contrast", "brightness", "pipeline", "config", "quality"]

    def __init__(self, **kwargs):
        super_args = {k: v for k, v in kwargs.items() if not k in self.uhdr_args }
        super(IIIFManipulatorUHDR, self).__init__(**super_args)
        self.compliance_level = 2
        self.image = None
        self.outtmp = None
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

    def set_max_image_pixels(self, pixels):
        # Default is alway UHDR max
        if pixels < 32768 * 32768:
            pixels = 32768 * 32768
        Image.MAX_IMAGE_PIXELS = pixels

    # Loads the image
    def do_first(self):
        self.image = Image.open(self.srcfile)
        self.exif = self.image.getexif()
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
            # Create temp
            # temp_file = tempfile.NamedTemporaryFile(delete=False)
            # self.outfile = temp_file.name
            raise ValueError("Output file not set")
        w, h = self.image.size
        self.logger.debug("Saving fragment %dx%d format '%s'", w, h, format)
        self.mime_type = "image/jpeg"
        # self._save(self.outfile)
        if self.image is None:
            raise ValueError("No image to process!")
        uhdr = UHDR(self.image, metadata=self.exif, contrast=self.contrast, brightness=self.brightness, pipeline=self.pipeline, scale=False, config=self.config)
        uhdr.process(self.outfile)

    def cleanup(self):
        with self.image as i:
            i.close()
