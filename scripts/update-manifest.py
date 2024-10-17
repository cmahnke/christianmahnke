import json
import argparse
import math
import sys
from termcolor import cprint
from typing import Any, Dict, List, Optional
from iiif_prezi3.loader import monkeypatch_schema
from iiif_prezi3 import Manifest, Annotation, ResourceItem, Base
from shapely import Polygon, MultiPolygon, LineString, box, union_all, to_geojson
import scour

TOUCH_CONTEXT = "https://christianmahnke.de/iiif/touch/context.json"

selectorType = "media-frag"
compact = True

class ValueBody():
    value: Optional[Any] = None

class HapticsBody():
    haptics: Optional[Any] = None

def load_manifest(src):
    with open(src, encoding="utf-8") as json_data:
        manifest_json = json.load(json_data)
        m = Manifest(**manifest_json)
    return m

def load_heightmap(src):
    with open(src, encoding="utf-8") as heightmap_data:
        heightmap_json = json.load(heightmap_data)
    return heightmap_json

def write(str, file):
    with open(file, "w", encoding="utf-8") as out:
        out.write(str)

def bbox_to_svg_polygon(x, y, w, h):
    points = f"{x},{y} {x+w},{y} {x+w},{y+h} {x},{y+h}"
    return f"<polygon points=\"{points}\" />"

def polygon_to_svg_polygon(polygon):
    points = ""
    for x,y in make_end_implicit(polygon.exterior.coords):
        points += f"{int(x)},{int(y)} "
    #points = list(polygon.boundary.coords)
    return f"<polygon points=\"{points.rstrip()}\" />"

def bbox_to_polygon(x, y, w, h):
    return box(x, y, x+w, y+h);

def union_boxes(boxes):
    return union_all(boxes)

def optimize_svg(str):
    return str
    #return scour.scour(svg_data)

def make_end_implicit(poly):
    if all(p1 == p2 for p1, p2 in zip(poly[0], poly[-1])):
        return poly[:-1]
    return poly

def line_to_svg_polygon(line):
    return " ".join(",".join(str(p) for p in point) for point in line)

# See https://github.com/fgassert/split_donuts/blob/master/split_donuts.py
def decompose(polygon_union):
    def splitting_axe(polygon, hole):
        bbox = polygon.bounds
        x1, y1, x2, y2 = bbox
        if hole.x < x1 or hole.x > x2:
            return [polygon]

        leftHalf = LineString([(x1, y1), (hole.x, y2)])
        rightHalf  = LineString([(hole.x, y1), (x2, y2)])

        return [polygon.intersection(leftHalf.envelope), polygon.intersection(rightHalf.envelope)]

    simple_polygons = []
    if polygon_union.geom_type == 'MultiPolygon':
        for polygon in polygon_union.geoms:
            simple_polygons.extend(decompose(polygon))
    elif polygon_union.geom_type == 'Polygon':
        if len(polygon_union.interiors):
            hole = polygon_union.interiors[0].centroid

            halves = splitting_axe(polygon_union, hole)
            for h in halves:
                simple_polygons.extend(decompose(h))

        else:
            simple_polygons.append(polygon_union)

    elif polygon_union.geom_type == 'GeometryCollection':
        for feature in polygon_union.geoms:
            simple_polygons.extend(decompose(feature))
    else:
        pass
        #raise RuntimeError(f"Shape {polygon_union.geom_type} is not a polygon.")

    return simple_polygons

def svg_wrap(elements, options=None):
    attrs = ""
    if options is not None and "viewBox" in options:
        attrs = f"viewBox=\"{options["viewBox"]}\""
    if isinstance(elements, str):
        elements = [elements]
    svg = f"<svg {attrs} xmlns=\"http://www.w3.org/2000/svg\">{''.join(elements)}</svg>"
    if options is not None and "optimize" in options and options["optimize"] is True:
        svg = optimize_svg(svg)
    return svg

def gen_selector(type, bbox, options=None):
    if isinstance(bbox, (tuple, list)):
        x, y ,w, h = bbox
    if type == "media-frag":
        selector = {
            "type": "FragmentSelector",
            "conformsTo": "http://www.w3.org/TR/media-frags/",
            "value": f"xywh=pixel:{x},{y},{w},{h}"
            }
    elif type == "svg":
        if isinstance(bbox, (tuple, list)):
            points = bbox_to_svg_polygon(x, y, w, h)
        else:
            if not isinstance(bbox, str):
                points = polygon_to_svg_polygon(bbox)
            else:
                points = bbox

        selector = {
                     "type": "SvgSelector",
                     "value": svg_wrap(points, options)
                    }
    else:
        selector = {
            "x": x,
            "y": y,
            "w": w,
            "h": h
        }
    return selector

def compact_shapely(fragments, options=None):
    polygons = []
    for fragment in fragments:
        polygons.append(bbox_to_polygon(fragment["selector"]["x"],fragment["selector"]["y"],fragment["selector"]["w"],fragment["selector"]["h"]))
    union = union_boxes(polygons)
    svg = []

    for i, polygon in enumerate(decompose(union)):
        svg.append(polygon_to_svg_polygon(polygon))

    return svg

def transform_heightmap(heightmap, filter=False):
    fragments = []

    height = heightmap["height"]
    width = heightmap["width"]
    scale = heightmap["meta"]["scale"]
    x = heightmap["meta"]["x"]
    y = heightmap["meta"]["y"]
    data = heightmap["data"]
    touch_w = math.ceil(1 * scale)
    touch_h = math.ceil(1 * scale)

    for i in range(height):
        for j in range(width):
            state = data[i][j]
            id_suffix = f"/touch/{i}/{j}"

            touch_x = int(math.ceil(1 * scale * j + x))
            touch_y = int(math.ceil(1 * scale * i + y))

            selector = {
                "x": touch_x,
                "y": touch_y,
                "w": touch_w,
                "h": touch_h
            }

            fragment = {"id_suffix": id_suffix,"state": state, "selector": selector}
            if not filter or (filter and state):
                fragments.append(fragment)

    return fragments


# This has still problems with the state value
def compact_heightmapRLE(heightmap, filter=False):
    fragments = []
    height = heightmap["height"]
    width = heightmap["width"]
    scale = heightmap["meta"]["scale"]
    x = heightmap["meta"]["x"]
    y = heightmap["meta"]["y"]
    data = heightmap["data"]
    touch_w = math.ceil(1 * scale)
    touch_h = math.ceil(1 * scale)

    for i in range(height):
        last = data[i][0]
        rle = [0]
        for j in range(width):
            if data[i][j] == last:
                rle[len(rle) - 1] += 1;
            else:
                rle.append(1)
                last = data[i][j]

        start = data[i][0]
        pos = 0
        for k in range(len(rle)):
            state = start + (k % 2) - 1
            id_suffix =  f"/touch/{i}/{k}";
            touch_x = math.ceil(1 * scale * pos + x)
            touch_y = math.ceil(1 * scale * i + y)
            touch_w = math.floor(1 * scale * rle[k])
            pos += rle[k]

            selector = {
                "x": touch_x,
                "y": touch_y,
                "w": touch_w,
                "h": touch_h
            }

            fragment = {"id_suffix": id_suffix,"state": state, "selector": selector}
            if not filter or (filter and state):
                fragments.append(fragment)

    return fragments

def create_annotation(selector, target, id_prefix, id_suffix, type="InteractiveResource", value={"haptics": {"vibrate": True}}, motivation="sensing"):
    body = ResourceItem(id=id_prefix + id_suffix + "/body", type=type, **value)
    anno = Annotation(id=id_prefix + id_suffix, target=target, motivation=motivation, body=body)
    return anno

def prepare_heightmap(heightmap, filter=True, compact=True, merge_svg=False):
    height = heightmap["meta"]["height"]
    width = heightmap["meta"]["width"]
    x = heightmap["meta"]["x"]
    y = heightmap["meta"]["y"]
    fragments = transform_heightmap(heightmap, filter=filter)
    cprint(f"Generated {len(fragments)} filtered? {filter}", 'yellow', file=sys.stderr)
    selectors = []
    if compact:
        svg = compact_shapely(fragments, {"viewBox": f"{x} {y} {width} {height}"})
        cprint(f"Reduced to {len(svg)} filtered? {filter}", 'yellow', file=sys.stderr)

        if merge_svg:
            selectors.append(gen_selector("svg", ''.join(svg)))
        else:
            for s in svg:
                selectors.append(gen_selector("svg", s))
    else:
        # This returns just the squares
        #svg = []
        for polygon in fragments:
            selectors.append(gen_selector("media-frag", list(polygon["selector"].values())))
            #polygon = bbox_to_polygon(**polygon["selector"])
            #svg.append(polygon_to_svg_polygon(polygon))

    # TODO: Use this to debug SVG
    #print(svg_wrap(svg, {"viewBox": f"{x} {y} {width} {height}"}))

    return selectors

def convert_heightmap(heightmap, id, canvas, compact=True):
    def convert_single(heightmap, id, canvas, compact=True):
        target_suffix = f"#xywh={heightmap["meta"]["x"]},{heightmap["meta"]["y"]},{heightmap["meta"]["width"]},{heightmap["meta"]["height"]}"
        annos = []
        if "name" in heightmap:
            name_body = ResourceItem(id= id + "/name",type = "TextualBody", value = heightmap["name"])
            target = {"source": canvas, "selector": gen_selector("media-frag",( heightmap["meta"]["x"], heightmap["meta"]["y"], heightmap["meta"]["width"], heightmap["meta"]["height"]))}

            name_anno = Annotation(id=id + "/name", target=target, motivation="sensing", body=name_body)
            annos.append(name_anno)
        for i, touch_area in enumerate(prepare_heightmap(heightmap, filter=True, compact=compact)):
            target = { "source": canvas, "selector": touch_area}
            touch_anno = create_annotation(touch_area, target, id, f"/touch/{i}")
            annos.append(touch_anno)

        return annos

    converted = []
    if isinstance(heightmap, list):
        for i, fragment in enumerate(heightmap):
            converted.extend(convert_single(fragment, id.format(i=i), canvas, compact=compact))
    elif isinstance(heightmap, dict):
        converted.extend(convert_single(heightmap, id.format(i=1), canvas, compact=compact))
    else:
        raise RuntimeError("Unexpected format")
    return converted

# Hack the model during runtime
def update_model():
    from pydantic.fields import ModelField
    ResourceItem.__annotations__["value"] = "Optional[Any]"
    ResourceItem.__fields__["value"] = ModelField(name='value', type_=Optional[Any], required=False, class_validators={}, default=None, model_config=Base.__config__)
    ResourceItem.__annotations__["haptics"] = "Optional[Any]"
    ResourceItem.__fields__["haptics"] = ModelField(name='haptics', type_=Optional[Any], required=False, class_validators={}, default=None, model_config=Base.__config__)
    monkeypatch_schema(ResourceItem, ValueBody)

update_model()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(prog='update-manifest.py')
    parser.add_argument('--input', '-i', required=True, help='Input file')
    parser.add_argument('--annotation', '-a', required=True, help='Input file')
    parser.add_argument('--output', '-o', help='Output file')
    parser.add_argument('--single', '-s', action='store_true', default=(not compact), help=f"Compact default: {compact}")
    args = parser.parse_args()

    manifest = load_manifest(args.input)
    compact = not args.single
    cprint(f"compact set to {compact}", 'yellow', file=sys.stderr)
    for canvas in manifest.items:
        id = canvas.id
        heightmap = load_heightmap(args.annotation)

        generated_annotations = convert_heightmap(heightmap, id + "/annotation/{i}",  id, compact)

        for anno in generated_annotations:
            canvas.add_annotation(anno)

    initial_context = manifest.context
    manifest.context = [TOUCH_CONTEXT, initial_context]

    if args.output:
        # Clean up "target": {"type": "SpecificResource",
        if args.output == '-':
            print(manifest.json(indent=4))
        else:
            write(manifest.json(), args.output)
