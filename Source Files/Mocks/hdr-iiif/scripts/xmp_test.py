import sys
import logging
from pathlib import Path

from pprint import pprint

import PIL
from PIL import Image, JpegImagePlugin, MpoImagePlugin
from xml.etree import ElementTree as ET

from ImageXmp import ImageXmp, _get_size
import UhdrImagePlugin

TEST_IMG = "../img/white-hdr.jpeg"
TEST_CLEAN_OUT = "../img/out.jpeg"
TEST_SINGLE_OUT = "../img/xmp.jpeg"
TEST_UHDR_OUT = "../img/generated-uhdr.jpeg"


def fake_xmp() -> str:
    root = ET.Element("{adobe:ns:meta/}xmpmeta")
    rdf = ET.SubElement(root, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}RDF")
    description = ET.SubElement(rdf, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
    description.attrib.update({"{http://ns.adobe.com/hdr-gain-map/1.0/}Version": "1.0"})
    container = ET.SubElement(description, "{http://ns.google.com/photos/1.0/container/}Directory", name="blah").text = (
        "FAKE ENTRY"
    )
    title = ET.SubElement(description, "{http://purl.org/dc/elements/1.1/}title").text = "Mocked XMP"
    return ET.tostring(root, encoding="unicode") + "\n"


if not Path(TEST_IMG).is_file():
    print(f"{TEST_IMG} doesn't exist")
    sys.exit(1)

print(f"Pillow is version {PIL.__version__}")

logging.basicConfig(level=logging.DEBUG)
image = Image.open(TEST_IMG)
xmp = ImageXmp.get_xmp(image)
icc = image.info.get("icc_profile")
print(type(image))


print(xmp)
print("----------")
image.encoderinfo = {}
# image.encoderinfo["icc_profile"] = icc
# with open(TEST_CLEAN_OUT, "wb") as fp:
#    JpegImagePlugin._save(image, fp, TEST_CLEAN_OUT)

print(type(image))
image.save(TEST_CLEAN_OUT, "JPEG")

xml = fake_xmp()
print(xml)
print("-----Writing file - single image mode with mp -----")
if int(PIL.__version__.split(".")[0]) >= 11:
    image.save(TEST_SINGLE_OUT, xmp=xml.encode())
else:
    image.encoderinfo["extra"] = ImageXmp.xmp_extra(xml)
    print(image.info)
    with open(TEST_SINGLE_OUT, "wb") as fp:
        JpegImagePlugin._save(image, fp, TEST_SINGLE_OUT)
print("!!!!!!!FILE WRITTEN!!!!!!! -> Reopening")
written_image = Image.open(TEST_SINGLE_OUT)
print("---XMP from witten image-------")
print(ImageXmp.get_xmp(written_image))
print("---Reload Image with registred UhdrImagePlugin -------")
from UhdrImagePlugin import UhdrImageFile, jpeg_factory, check_uhdr

Image.register_open(JpegImagePlugin.JpegImageFile.format, jpeg_factory, JpegImagePlugin._accept)
if int(PIL.__version__.split(".")[0]) >= 11:
    Image.register_save_all(UhdrImageFile.format, MpoImagePlugin._save_all)
else:
    Image.register_save_all(UhdrImageFile.format, UhdrImagePlugin._save_all)

image = Image.open(TEST_IMG)
xmp = ImageXmp.from_image(image)
icc = image.info.get("icc_profile")
exif = image.getexif()
print(type(image))
image.seek(1)
gainmap = image.copy()
gainmap_xmp = ImageXmp.from_image(image)
image.seek(0)
image = image.copy()


print("---Try to craft UHDR, updating saved primary xmp first-------")
print(type(xmp))
print(xmp.tostring())
gainmap_size = _get_size(gainmap)
updated_xmp = ImageXmp.update_gainmap_xmp(xmp.tostring(), gainmap_size)
updated_xmp = ImageXmp(updated_xmp)
print(updated_xmp.tostring())
if int(PIL.__version__.split(".")[0]) >= 11:
    image.convert("YCbCr")
    image.encoderinfo = {}
    image.encoderinfo["xmp"] = updated_xmp.tostring().encode()
    gainmap = gainmap.copy()
    gainmap = gainmap.convert("YCbCr")
    # See https://github.com/manoreken2/pillow-avif-plugin-HDR10?tab=readme-ov-file#how-to-write-hdr10pq-10bit-avif-file
    # gainmap = gainmap.convert("R16G16B16")
    # See subsampling=
    gainmap.encoderinfo = {}
    gainmap.encoderinfo["xmp"] = gainmap_xmp.tostring().encode()
    pprint(vars(gainmap))
else:
    image.info["xmp"] = updated_xmp.tobytes()
    gainmap.info["xmp"] = gainmap_xmp.tobytes()
print("---Try to save crafted UHDR-------")

image.encoderinfo = {
    "append_images": [gainmap],
    #    "exif": exif,
    "icc_profile": icc,
}
if int(PIL.__version__.split(".")[0]) >= 11:
    image.encoderinfo["xmp"] = updated_xmp.tostring().encode()


if int(PIL.__version__.split(".")[0]) >= 11:
    with open(TEST_UHDR_OUT, "wb") as fp:
        # MpoImagePlugin._save_all(image, fp, TEST_UHDR_OUT)
        UhdrImagePlugin._save_all(image, fp, TEST_UHDR_OUT)
else:
    with open(TEST_UHDR_OUT, "wb") as fp:
        UhdrImagePlugin._save_all(image, fp, TEST_UHDR_OUT)


if not check_uhdr(TEST_UHDR_OUT):
    print(f"{TEST_UHDR_OUT} is not a valid UHDR file")
