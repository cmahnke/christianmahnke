import tempfile

from iiif.manipulator import IIIFManipulator

from PIL import Image

from UhdrImagePlugin import check_uhdr
from ImageXmp import ImageXmp, _get_size


class IIIFManipulatorUHDR(IIIFManipulator):

    tmpdir = "/tmp"
    filecmd = None
    pnmdir = None

    def __init__(self, **kwargs):
        super(IIIFManipulatorUHDR, self).__init__(**kwargs)
        self.compliance_level = 2
        self.image = None
        self.outtmp = None
        self.work_image_initialized = False
        self.height = 0
        self.width = 0
        self.gainmap = None
        self.icc = None
        self.xmps = []
        self.mime_type = None
        self.exif = None

    def set_max_image_pixels(self, pixels):
        # Default is alway UHDR max
        if pixels < 32768 * 32768:
            pixels = 32768 * 32768
        Image.MAX_IMAGE_PIXELS = pixels

    # Loads the image
    def do_first(self):
        self.image = Image.open(self.srcfile)
        self.icc = self.image.info.get("icc_profile")
        self.xmps.append(self.image.get_xmp())
        self.exif = self.image.getexif()
        self.logger.debug("Loaded image size %s", self.image.size)

        if self.image.n_frames > 1:
            self.image.seek(1)
            self.gainmap = self.image.copy()
            self.xmps.append(self.image.get_xmp())
        else:
            # pass
            raise IndexError(f"Couldn't find gain map in {self.srcfile}")
        self.image.seek(0)
        self.width, self.height = self.image.size

    def do_region(self, x, y, w, h):
        if x is None:
            self.logger.debug("Ignore crop without args")
        else:
            self.image, self.gainmap = self._crop((x, y, x + w, y + h))
            self.work_image_initialized = True
            self.width = w
            self.height = h

    def do_size(self, w, h):
        if w is None:
            self.logger.debug("Ignore scale without args")
        else:
            self.logger.debug("Scaling to %dx%d", w, h)
            self.image, self.gainmap = self._resize((w, h))
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
            temp_file = tempfile.NamedTemporaryFile(delete=False)
            self.outfile = temp_file.name
        self.mime_type = "image/jpeg"
        self._save(self.outfile)

    def _crop(self, dim):
        self.logger.debug("Cropping from %s to %s", self.image.size, dim)
        x, y, w, h = dim
        self.image.seek(0)
        primary_dim = self.image.size
        primary = self.image.crop((x, y, w, h))

        self.image.seek(1)
        gainmap_size = self.image.size
        w_multiplier = gainmap_size[0] / primary_dim[0]
        h_multiplier = gainmap_size[1] / primary_dim[1]
        gainmap_dim = (
            x * w_multiplier,
            y * h_multiplier,
            w * w_multiplier,
            h * h_multiplier,
        )
        self.logger.debug("Cropping gainmap to %s", gainmap_dim)
        gainmap = self.image.crop(gainmap_dim)
        self.logger.debug(
            "Primary size %s, gainmap size %s, multipliers w: %s, h: %s",
            primary_dim,
            gainmap_size,
            w_multiplier,
            h_multiplier,
        )

        return (primary, gainmap)

    def _resize(self, dim):
        self.logger.debug("Resize from %s to %s", self.image.size, dim)
        self.image.seek(0)
        primary_dim = self.image.size
        primary = self.image.resize(dim)

        def gainmap_scale(new_dim, gainmap_dim, primary_dim):
            w_multiplier = gainmap_dim[0] / primary_dim[0]
            h_multiplier = gainmap_dim[1] / primary_dim[1]
            new_w = int(new_dim[0] * w_multiplier)
            if new_w < 2:
                new_w = 2
            new_h = int(new_dim[1] * h_multiplier)
            if new_h < 2:
                new_h = 2
            self.logger.debug(
                "Primary size %s, gainmap size %s, expected size %s, multipliers w: %s, h: %s, calculated w: %s h %s",
                primary_dim,
                gainmap_dim,
                new_dim,
                w_multiplier,
                h_multiplier,
                new_w,
                new_h,
            )
            return (new_w, new_h)

        if not self.work_image_initialized:
            self.image.seek(1)
            gainmap_dim = self.image.size
            new_dim = gainmap_scale(dim, gainmap_dim, primary_dim)
            # w_multiplier = gainmap_size[0] / primary_dim[0]
            # h_multiplier = gainmap_size[1] / primary_dim[1]
            # gainmap_dim = (int(dim[0] * w_multiplier), int(dim[1] * h_multiplier))
            gainmap = self.image.resize(new_dim)
        else:
            gainmap_dim = self.gainmap.size
            # w_multiplier = gainmap_size[0] / primary_dim[0]
            # h_multiplier = gainmap_size[1] / primary_dim[1]
            # gainmap_dim = (int(dim[0] * w_multiplier), int(dim[1] * h_multiplier))
            new_dim = gainmap_scale(dim, gainmap_dim, primary_dim)
            gainmap = self.gainmap.resize(new_dim)
        self.logger.debug("Resized gainmap from %s to %s", gainmap_dim, new_dim)

        return (primary, gainmap)

    def _save(self, filename):
        self.image.seek(0)
        self.image.info["icc_profile"] = self.icc

        # if not hasattr(self.image, "encoderinfo"):
        #    self.image.encoderinfo = {}
        gainmap_size = _get_size(self.gainmap)
        updated_xmp = ImageXmp.update_gainmap_xmp(self.xmps[0].tostring(), gainmap_size)
        # self.logger.debug(f"Updated primary XMP to {updated_xmp.tostring()}")
        self.xmps[0] = ImageXmp(updated_xmp)
        # TODO: This needs an update
        self.logger.debug("Setting primary XMP to %s", self.xmps[0].tostring())
        self.image.encoderinfo["xmp"] = self.xmps[0].tostring()

        # self.image.seek(1)
        # if not hasattr(self.gainmap, "encoderinfo"):
        #    self.gainmap.encoderinfo = {}
        self.logger.debug("setting gainmap XMP to %s", self.xmps[1].tostring())
        self.gainmap.encoderinfo["xmp"] = self.xmps[1].tostring()
        self.image.save(
            filename,
            save_all=True,
            append_images=[self.gainmap],
            exif=self.exif,
            icc_profile=self.icc,
        )
        if not check_uhdr(filename):
            self.logger.warning("%s is not a valid UHDR file", filename)

    def cleanup(self):
        with self.image as i:
            i.close()
