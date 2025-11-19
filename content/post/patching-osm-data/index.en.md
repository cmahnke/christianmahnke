---
date: 2025-11-17T21:14:44+02:00
title: "\"Patching\" OpenStreetMap data"
tags:
  - Geodata
  - OpenStreetMap
  - Python
wikidata:
  - https://www.wikidata.org/wiki/Q12877
  - https://www.wikidata.org/wiki/Q116859588
  - https://www.wikidata.org/wiki/Q107385647
  - https://www.wikidata.org/wiki/Q110609581
  - https://www.wikidata.org/wiki/Q935780
---

"Counterfactual architecture" yields almost no results on Google (at least in German)....
<!--more-->

...which is why I'm writing this post to change that:
For the [Never Built Göttingen](https://never-built.goettingen.xyz/) blog, which focuses on unrealised buildings, I tried to enrich this what-if scenario with map material.

Based on [OpenStreetMap](https://www.openstreetmap.org/) (OSM), this is not that difficult in principle. With [JOSM](https://josm.openstreetmap.de/), you can simply download the desired map section and then start drawing. It is important to mark your own buildings with ‘upload=false’ for safety reasons to prevent accidental uploads.

However, at best, you will then have created a fork of the data in OSM XML format. If you prefer to continue working only with the difference to the real map in order to have future changes in the displayed map material, things get a little more complicated. One option is to use special tools for [merging/conflating](https://wiki.openstreetmap.org/wiki/Conflation).

Another option, which focuses solely on meeting specific requirements, is outlined here:

# Procedure

The prominent [entry for the three blue towers](https://never-built.goettingen.xyz/post/staedte-forum-1-71-goettingen/gwz/) serves as an example; it was quite easy to model in JOSM.

## Extracting the changes

The first step is to isolate your own changes. You can use `osmium` for this, for example:

```bash
osmium tags-filter -o filtered.osm.xml w/upload=false input.osm.xml
```

Since the result was saved as XML, it can be opened again in JOSM:

{{< figure src="josm.png" alt="JOSM" class="post-image" >}}

## Creating a mask

The next step is to create a kind of mask from the isolated changes, which can then be used to filter a larger area. This and the following steps were done with [PyOsmium](https://docs.osmcode.org/pyosmium/latest/); for implementation, see below.

When creating the mask, the OSM IDs of the changes are also adjusted: These are negative up to this point, as they are not ‘real’, i.e. part of the central OSM database. However, various libraries or even [Planetiler](https://github.com/onthegomap/planetiler) do not like it when they are negative, so they are simply multiplied by -1.

## Cleaning up the input file

The mask can now be used to clean up an OSM data dump. The entire desired map section is scanned and any OSM way that intersects the mask is discarded. This allows existing buildings, green spaces, etc. to be removed.

## Merging

The final step is to merge the cleaned-up area with your own changes.

# Result

The next step is to convert the OSM PBF file into vector tiles using [Planetiler](https://github.com/onthegomap/planetiler).

And this is what the generated map data looks like in a provisional [Maplibre JS GL](https://maplibre.org/maplibre-gl-js/docs/) renderer:

{{< figure src="render.png" alt="Mapbox JS GL" class="post-image" caption="Map data: © OpenStreetMap contributors, elevation information: LGLN (2024)" >}}

# Implementation

This Python function performs the steps above, the individual parameters:
* **`base_file`** - The data dump of the entire area
* **`patch`** - The cleaned-up changes created with JOSM
* **`output_file`** - The target file
* **`overwrite`** - Overwrite existing files (`True` | `False`)

```python
def merge (base_file, patch, output_file, overwrite) -> None:

    class IntersectionHandler(osmium.SimpleHandler):
        """
        Handler to identify ways in an OSM file that intersect with a given set of polygons.
        """
        def __init__(self, target_polygons):
            super(IntersectionHandler, self).__init__()
            self.target_polygons = target_polygons
            self.wkbfactory = osmium.geom.WKBFactory()
            self.intersecting_ways = []

        #TODO: Check if we also need to remove nodes
        def way(self, w):

            if w.is_closed():
                try:
                    wkb_line = self.wkbfactory.create_linestring(w)
                    shapely_line = shapely.from_wkb(wkb_line)

                    if len(shapely_line.coords) >= 4:
                        closed_way_polygon = Polygon(shapely_line)

                        for target_poly in self.target_polygons:
                            if closed_way_polygon.intersects(target_poly):
                                self.intersecting_ways.append({
                                    'id': w.id,
                                    'tags': dict(w.tags),
                                    'geometry': closed_way_polygon
                                })
                                break

                except osmium.geom.GeometryError as e:
                    logger.error(f"Could not create geometry for Way {w.id}: {e}")

    class IDChanger(osmium.SimpleHandler):
        """
        Handler to write OSM objects to a new file, changing their IDs to positive values.
        """
        def __init__(self, writer):
            super(IDChanger, self).__init__()
            self.writer = writer

        def node(self, n):
            new_node = create_mutable_node(n)
            new_node.id = n.id * -1
            logger.debug(f"Changing node ID from {n.id} to {new_node.id}")
            self.writer.add_node(new_node)

        def way(self, w):
            new_way = create_mutable_way(w)
            new_way.id = w.id * -1
            new_way.nodes = None
            refs = []
            for r in w.nodes:
                r.ref = r.ref * -1
                refs.append(r)
            new_way.nodes = refs
            logger.debug(f"Changing way ID from {w.id} to {new_way.id}")
            self.writer.add_way(new_way)

        def relation(self, r):
            new_relation = create_mutable_relation(r)
            new_relation.id = r.id * -1
            logger.debug(f"Changing relation ID from {r.id} to {new_relation.id}")
            self.writer.add_relation(new_relation)

    class ExcludingIdFilter:
        """
        A filter class for osmium.FileProcessor to exclude objects based on their IDs, see https://github.com/osmcode/pyosmium/issues/310
        """
        def __init__(self, ids):
            self.ids = ids

        def node(self, n):
            if n.id in self.ids:
                return True
            return False

        def way(self, w):
            if w.id in self.ids:
                return True
            return False

        def relation(self, r):
            if r.id in self.ids:
                return True
            return False

        def area(self, a):
            if a.id in self.ids:
                return True
            return False

    logger.info("Generating mask and appying it to the input file.")
    # Step 1: Process the patch file to change IDs to positive and extract polygons.
    # This temporary file will hold the patch with inverted IDs.

    with tempfile.NamedTemporaryFile(mode='w+t', delete=True, suffix=".pbf",) as temp:
        with osmium.SimpleWriter(temp.name, overwrite=True) as writer:
            handler = IDChanger(writer)
            osmium.apply(patch, handler)
            writer.close()
        wkbfab = osmium.geom.WKBFactory()
        polygons = []
        # Read the transformed patch file to extract geometries for exclusion.
        with open(temp.name, 'rb') as f:
            patch_buffer = f.read()
            patch_pbf = osmium.io.FileBuffer(patch_buffer, "pbf")
            for o in osmium.FileProcessor(patch_pbf).with_areas():
                logger.debug(f"Generating {o.type_str()} filter primitive for {o.type_str()}, id: {o.id}")
                if o.is_way() and not o.is_closed():
                    wkb = shapely.from_wkb(wkbfab.create_linestring(o.nodes))
                elif o.is_area():
                    logger.debug(f"Area: {o.__dict__}")
                    wkb = shapely.from_wkb(wkbfab.create_multipolygon(o))
                else:
                    wkb = None
                polygons.append(wkb)
    # Filter out any None values from the polygons list (e.g., non-closed ways, nodes, relations)
    polygons = [item for item in polygons if item is not None]
    logger.info(f"Extracted {len(polygons)} polygons to use as filter.")
    # Step 2: Identify ways in the base file that intersect with the extracted polygons.
    handler = IntersectionHandler(polygons)
    handler.apply_file(base_file, locations=True, idx='flex_mem')
    results = handler.intersecting_ways

    # Collect IDs of ways to be excluded from the base file.
    ids = []
    for i in results:
        ids.append(i['id'])
    logger.debug(ids)

    # Step 3: Create a temporary base file with intersecting ways removed.
    with tempfile.NamedTemporaryFile(mode='w+t', delete=True, suffix=".pbf") as temp:
        with osmium.BackReferenceWriter(temp.name, base_file, overwrite=True) as writer:
            for o in osmium.FileProcessor(base_file)\
                .with_filter(osmium.filter.EntityFilter(osmium.osm.WAY))\
                .with_filter(ExcludingIdFilter(ids)):
                writer.add(o)
        logger.info(f"Generated masked file. Applying patch. Overwrite: {overwrite}")
        # Step 4: Merge the filtered base file with the transformed patch file.
        with open(temp.name, 'rb') as f:
            with osmium.SimpleWriter(output_file, overwrite=overwrite) as writer:
                reader =  osmium.MergeInputReader()
                reader.add_buffer(patch_buffer, "pbf")
                reader.add_buffer(f.read(), "pbf")
                reader.apply(writer)
                writer.close()
    logger.info(f"Done, {output_file} written")

```
