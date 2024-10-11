import json
import argparse
from pprint import pprint
from typing import Any, Dict, List, Optional
from iiif_prezi3.loader import monkeypatch_schema
from iiif_prezi3 import Manifest, Annotation, ResourceItem, Base

class ValueBody():
    value: Optional[Any] = None

def load_manifest(src):
    with open(src, encoding="utf-8") as json_data:
        manifest_json = json.load(json_data)
        m = Manifest(**manifest_json)
    return m

def load_heightmap(src):
    with open(src, encoding="utf-8") as heightmap_data:
        heightmap_json = json.load(heightmap_data)
    return heightmap_json

def write(manifest, file):
    with open(file, "w", encoding="utf-8") as out:
        json.dump(manifest, out)

def convert_heightmap(heightmap, id, canvas):
    def convert_single(heightmap, id, canvas):
        target_suffix = f"#xywh={heightmap["meta"]["x"]},{heightmap["meta"]["y"]},{heightmap["meta"]["width"]},{heightmap["meta"]["height"]}"
        body = ResourceItem(id= id + "/body",type = "DataSet", value = heightmap)
        anno = Annotation(id=id, target=canvas+target_suffix, motivation="tagging", body=body)
        return anno

    converted = []
    if isinstance(heightmap, list):
        for i, fragment in enumerate(json):
            converted.append(convert_single(fragment, id.format(i=i), canvas))
    elif isinstance(heightmap, dict):
        converted.append(convert_single(heightmap, id.format(i=1), canvas))
    else:
        raise RuntimeError("Unexpected format")
    return converted

# Hack the model during runtime
def update_model():
    from pydantic.fields import ModelField
    ResourceItem.__annotations__["value"] = "Optional[Any]"
    ResourceItem.__fields__["value"] = ModelField(name='value', type_=Optional[Any], required=False, class_validators={}, default=None, model_config=Base.__config__)
    monkeypatch_schema(ResourceItem, ValueBody)

update_model()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(prog='update-manifest.py')
    parser.add_argument('--input', '-i', required=True, help='Input file')
    parser.add_argument('--annotation', '-a', required=True, help='Input file')
    parser.add_argument('--output', '-o', help='Output file')
    args = parser.parse_args()

    manifest = load_manifest(args.input)
    canvas = manifest.items[0]
    id = canvas.id
    heightmap = load_heightmap(args.annotation)

    generated_annotations = convert_heightmap(heightmap, id + "/annotation/{i}",  id)

    for anno in generated_annotations:
        manifest.add_annotation(anno)

    if args.output:
        if args.output == '-':
            print(manifest.json(indent=4))
        else:
            write(manifest, args.output)
