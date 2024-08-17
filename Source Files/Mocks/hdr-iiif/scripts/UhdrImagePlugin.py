# This is heavily inspired by the Pillow source https://github.com/python-pillow/Pillow/tree/main/src/PIL
from __future__ import annotations
from typing import IO, Any, cast
import itertools
import logging
import io
import os
import pathlib
import struct

from xml.etree import ElementTree as ET

from PIL import Image, ImageSequence, MpoImagePlugin, JpegImagePlugin, TiffImagePlugin
from PIL._binary import o32le

from ImageXmp import ImageXmp, NAMESPACES

for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)


class UhdrImageFile(MpoImagePlugin.MpoImageFile):
    format = "UHDR"
    format_description = "UHDR (UltraHDR)"
    _close_exclusive_fp_after_loading = False

    def _after_jpeg_open(self, mpheader: dict[int, Any] | None = None) -> None:
        # pylint: disable=attribute-defined-outside-init
        self.mpinfo = mpheader if mpheader is not None else self._getmp()
        if self.mpinfo is None:
            msg = "Image appears to be a malformed MPO file"
            raise ValueError(msg)
        self.n_frames = self.mpinfo[0xB001]
        self.__mpoffsets = [mpent["DataOffset"] + self.info["mpoffset"] for mpent in self.mpinfo[0xB002]]
        self.__mpoffsets[0] = 0
        # Note that the following assertion will only be invalid if something
        # gets broken within JpegImagePlugin.
        assert self.n_frames == len(self.__mpoffsets)
        # del self.info["mpoffset"]  # no longer needed
        self.is_animated = self.n_frames > 1
        self._fp = self.fp  # FIXME: hack
        self._fp.seek(self.__mpoffsets[0])  # get ready to read first frame
        self.__frame = 0
        self.offset = 0
        # for now we can only handle reading and individual frame extraction
        self.readonly = 1

    def tell(self) -> int:
        return self.__frame

    def seek(self, frame: int) -> None:
        if not self._seek_check(frame):
            return
        self.fp = self._fp
        self.offset = self.__mpoffsets[frame]

        self.original_exif = self.info.get("exif")
        if "exif" in self.info:
            del self.info["exif"]

        self.fp.seek(self.offset + 2)  # skip SOI marker
        if not self.fp.read(2):
            msg = "No data found for frame"
            raise ValueError(msg)
        self.fp.seek(self.offset)
        JpegImagePlugin.JpegImageFile._open(self)
        if self.info.get("exif") != self.original_exif:
            self._reload_exif()

        self.tile = [("jpeg", (0, 0) + self.size, self.offset, self.tile[0][-1])]
        self.__frame = frame

    def get_xmp(self):
        return ImageXmp.from_image(self)

    @staticmethod
    def adopt(
        jpeg_instance: JpegImagePlugin.JpegImageFile,
        mpheader: dict[int, Any] | None = None,
    ) -> UhdrImageFile:
        jpeg_instance.__class__ = UhdrImageFile
        uhdr_instance = cast(UhdrImageFile, jpeg_instance)
        uhdr_instance._after_jpeg_open(mpheader)
        return uhdr_instance


def jpeg_factory(fp: IO[bytes] | None = None, filename: str | bytes | None = None):
    im = JpegImagePlugin.JpegImageFile(fp, filename)
    try:
        mpheader = im._getmp()
        if mpheader is not None and mpheader[45057] > 1:
            for segment, content in im.applist:
                if segment == "APP1" and b' hdrgm:Version="' in content:
                    return UhdrImageFile.adopt(im, mpheader)
            # It's actually an MPO
            # pylint: disable=import-outside-toplevel
            from PIL.MpoImagePlugin import MpoImageFile

            # Don't reload everything, just convert it.
            im = MpoImageFile.adopt(im, mpheader)
    except (TypeError, IndexError):
        # It is really a JPEG
        pass
    except SyntaxError:
        logging.warning("Image appears to be a malformed MPO file, it will be interpreted as a base JPEG file")
    return im


def check_uhdr(image: Image | str | pathlib.Path) -> bool:
    Image.MAX_IMAGE_PIXELS = 32768 * 32768
    if isinstance(image, str):
        image = Image.open(image)
    elif isinstance(image, pathlib.Path):
        image = Image.open(image)

    if not isinstance(image, UhdrImageFile):
        logging.info("UHDR Validation: File %s is loaded as %s", image.filename, type(image))
        return False

    # See https://exiftool.org/TagNames/EXIF.html
    if image.n_frames < 2:
        logging.info("UHDR Validation: Number of frames to low %s for %s", image.n_frames, image)
        return False

    icc = image.info.get("icc_profile")
    if icc is None:
        logging.info("UHDR Validation: No ICC profile for %s", image.filename)
        return False

    # Try to parse ICC profile
    # pylint: disable=import-outside-toplevel
    from PIL import ImageCms

    binary_icc = io.BytesIO(icc)
    p_icc = ImageCms.ImageCmsProfile(binary_icc)
    if p_icc is None:
        logging.info("UHDR Validation: Couldn't parse ICC profile for %s", image.filename)
        return False

    xmps = {}
    for frame in range(2):
        image.seek(frame)
        print(vars(image))
        print(f"--> {JpegImagePlugin.get_sampling(image)}")

        try:
            xmp = image.get_xmp().toxml()
            logging.debug(
                "UHDR Validation: Parse XMP from %s, frame %s: %s", image.filename, frame, ET.tostring(xmp, encoding="unicode")
            )
            xmps[frame] = xmp
        except Exception as ex:
            logging.info(
                f"UHDR Validation: Couldn't parse XMP from {image.filename}, frame {frame}",
                ex,
            )
            return False

        if xmp.find("./rdf:RDF/rdf:Description[@hdrgm:Version]", namespaces=NAMESPACES) is None:
            logging.info(
                "UHDR Validation: XMP is missing 'hdrgm:Version' for %s, frame %s: %s",
                image.filename,
                frame,
                ET.tostring(xmp, encoding="unicode"),
            )
            return False

    return True


def _save(im: Image.Image, fp: IO[bytes], filename: str | bytes) -> None:
    xmp = im.info.get("xmp", None)
    if xmp is not None and isinstance(xmp, ImageXmp):
        im.encoderinfo["extra"] = xmp.tobytes()

    JpegImagePlugin._save(im, fp, filename)


def _save_all(im: Image.Image, fp: IO[bytes], filename: str | bytes) -> None:
    append_images = im.encoderinfo.get("append_images", [])
    if not append_images and not getattr(im, "is_animated", False):
        _save(im, fp, filename)
        return

    mpf_offset = 28
    offsets: list[int] = []
    for imSequence in itertools.chain([im], append_images):
        for im_frame in ImageSequence.Iterator(imSequence):
            if not offsets:
                # APP2 marker
                im_frame.encoderinfo["extra"] = b"\xFF\xE2" + struct.pack(">H", 6 + 82) + b"MPF\0" + b" " * 82
                exif = im_frame.encoderinfo.get("exif")
                if isinstance(exif, Image.Exif):
                    exif = exif.tobytes()
                    im_frame.encoderinfo["exif"] = exif
                if exif:
                    mpf_offset += 4 + len(exif)

                JpegImagePlugin._save(im_frame, fp, filename)
                offsets.append(fp.tell())
            else:
                secondary_xmp = im_frame.encoderinfo.get("xmp", None)
                if secondary_xmp is not None:
                    im_frame.save(fp, "JPEG", xmp=secondary_xmp)
                else:
                    im_frame.save(fp, "JPEG")
                offsets.append(fp.tell() - offsets[-1])

    ifd = TiffImagePlugin.ImageFileDirectory_v2()
    ifd[0xB000] = b"0100"
    ifd[0xB001] = len(offsets)

    mpentries = b""
    data_offset = 0
    for i, size in enumerate(offsets):
        if i == 0:
            mptype = 0x030000  # Baseline MP Primary Image
        else:
            mptype = 0x000000  # Undefined
        mpentries += struct.pack("<LLLHH", mptype, size, data_offset, 0, 0)
        if i == 0:
            data_offset -= mpf_offset
        data_offset += size
    ifd[0xB002] = mpentries

    fp.seek(mpf_offset)
    fp.write(b"II\x2A\x00" + o32le(8) + ifd.tobytes(8))
    fp.seek(0, os.SEEK_END)


Image.register_open(JpegImagePlugin.JpegImageFile.format, jpeg_factory, JpegImagePlugin._accept)

Image.register_extensions(UhdrImageFile.format, [".jpg", "jpeg"])
Image.register_mime(UhdrImageFile.format, "image/jpeg")
Image.register_save(UhdrImageFile.format, MpoImagePlugin._save)
Image.register_save_all(UhdrImageFile.format, _save_all)
