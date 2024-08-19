import io

from typing import Optional

from xml.etree import ElementTree as ET
from xml.etree.ElementTree import ParseError

from PIL import Image
from PIL._binary import o16be
from PIL.JpegImagePlugin import JpegImageFile

NAMESPACES = {
    "Item": "http://ns.google.com/photos/1.0/container/item/",
    "Container": "http://ns.google.com/photos/1.0/container/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "xmp": "http://ns.adobe.com/xap/1.0/",
    "x": "adobe:ns:meta/",
    "hdrgm": "http://ns.adobe.com/hdr-gain-map/1.0/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "xmpRights": "http://ns.adobe.com/xap/1.0/rights/",
    "": "http://ns.adobe.com/xap/1.0/",
}

XMP_MARKER = b"http://ns.adobe.com/xap/1.0/"
XMP_SEGMENT = "APP1"
XMP_MAX = 65504

for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)


class ImageXmp:
    def __init__(self, xmp: str | bytes | ET.ElementTree | ET.Element):
        if isinstance(xmp, ET.ElementTree):
            self.xmp_xml = xmp
            self.xmp_str = ET.tostring(xmp, encoding="unicode") + "\n"
            return
        if isinstance(xmp, ET.Element):
            xmp = ET.tostring(xmp, encoding="unicode") + "\n"
        if isinstance(xmp, bytes):
            xmp = xmp.decode(encoding="utf-8")
        self.xmp_str = xmp
        try:
            self.xmp_xml = ET.fromstring(xmp)
        except ParseError:
            raise ValueError(repr(xmp))

    def tostring(self) -> str:
        return self.xmp_str

    def toxml(self) -> str:
        return self.xmp_xml

    def tobytes(self) -> bytes:
        return ImageXmp.xmp_extra(self.xmp_str)

    def set(self, xmp: str | ET.ElementTree):
        if isinstance(xmp, ET.ElementTree):
            self.xmp_xml = xmp
            self.xmp_str = ET.tostring(xmp, encoding="unicode") + "\n"
        if isinstance(xmp, bytes):
            xmp = xmp.decode(encoding="utf-8")
        if isinstance(xmp, str):
            self.xmp_str = xmp
            self.xmp_xml = ET.fromstring(xmp)

    @staticmethod
    def from_image(image: JpegImageFile):
        return ImageXmp(ImageXmp.get_xmp(image))

    @staticmethod
    def get_xmp_xml(image: JpegImageFile) -> Optional[ET.ElementTree]:
        xmp = ImageXmp.get_xmp(image)
        if xmp is not None:
            return ET.fromstring(xmp)
        return None

    @staticmethod
    def get_xmp(image: JpegImageFile) -> str:
        for segment, content in image.applist:
            marker, body = content.split(b"\x00", 1)
            if segment == XMP_SEGMENT and marker == XMP_MARKER:
                return body

    @staticmethod
    def update_gainmap_xmp(xmp: str | ET.ElementTree, size: int, format: str = "JPEG") -> ET:
        if isinstance(xmp, (bytes, str)):
            xmp = ET.fromstring(xmp)
        elif not isinstance(xmp, ET.ElementTree):
            raise ValueError
        gainmap_meta = xmp.find(
            "./rdf:RDF/rdf:Description[@hdrgm:Version]//Container:Item[@Item:Semantic='GainMap']",
            namespaces=NAMESPACES,
        )
        if gainmap_meta is not None:
            # Python has one of the worst XML parsers / APIs possible
            gainmap_meta.attrib.update({"{http://ns.google.com/photos/1.0/container/item/}Length": str(size)})
            gainmap_meta.attrib.update({"{http://ns.google.com/photos/1.0/container/item/}Mime": Image.MIME[format]})

            return xmp
        return None

    @staticmethod
    def xmp_extra(xml: str | bytes | ET.ElementTree) -> bytes:
        if isinstance(xml, ET.ElementTree):
            xml = ET.tostring(xml, encoding="unicode")
        if isinstance(xml, bytes):
            xml = xml.decode(encoding="utf-8")
        if isinstance(xml, str):
            xml = xml.encode()
        if len(xml) > XMP_MAX:
            raise ValueError(f"CML is larger then {XMP_MAX}")
        length = len(XMP_MARKER) + 2 + len(xml) + 1
        return b"\xFF\xE1" + o16be(length) + XMP_MARKER + b"\0" + xml


@staticmethod
def _get_size(gainmap: Image, format: str = "JPEG") -> int:
    byte_img = io.BytesIO()
    gainmap.save(byte_img, format=format)
    return byte_img.getbuffer().nbytes
