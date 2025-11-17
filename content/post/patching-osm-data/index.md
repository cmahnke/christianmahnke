---
date: 2025-11-17T21:14:44+02:00
title: "OpenStreetMap Daten \"patchen\""
tags:
  - Geodata
  - OpenStreetMap
wikidata:
  - https://www.wikidata.org/wiki/Q12877
  - https://www.wikidata.org/wiki/Q116859588
  - https://www.wikidata.org/wiki/Q107385647
  - https://www.wikidata.org/wiki/Q110609581
---

"Kontrafaktische Architektur" liefert fast keine Treffer bei Google....
<!--more-->

... deshalb dieser Beitrag, um das zu ändern:
Für das [Never Built Göttingen](https://never-built.goettingen.xyz/) Blog, indem es um nicht realisierte Gebäude geht, habe ich versucht dieses Was-wäre-wenn-Szenario mit Kartenmaterial zu bereichern.

Auf Basis von [OpenStreetMap](https://www.openstreetmap.org/) (OSM) ist das grundsätzlich nicht so schwer, mit [JOSM](https://josm.openstreetmap.de/) kann man sich einfach den gewünschten Kartenausschnitt herunterladen und dann anfangen zu zeichnen. wichtig ist, dass man die eigenen Gebäude zur Sicherheit mit "upload=false" auszeichnet, um versehentliche Uploads zu verhindern.

Allerdings hat man dann bestenfalls einen Fork der Daten im OSM XML Format erzeugt. Wenn man lieber nur mit der Differenz zu echten Karte weiterarbeiten will, um auch zukünftige Änderungen im anzeigten Kartenmaterial zu haben, wird die Sache etwas komplizierter. Eine Möglichkeit sind spezielle Werkzeuge zur [Verschmelzung / Zusammenführung](https://wiki.openstreetmap.org/wiki/Conflation) (englisch "Conflation").

Eine andere, die sich nur auf die Erfüllung der konkreten Anforderungen konzentriert, ist hier skizziert:

# Ablauf

Als Beispiel dient der prominente [Eintrag zu den drei blauen Türmen](https://never-built.goettingen.xyz/post/staedte-forum-1-71-goettingen/gwz/), er ließ sich recht einfach in JOSM modellieren.

## Extraktion der Änderungen

Der erste Schritt ist es die eigenen Änderungen zu isolieren, dazu kann z.B. `osmium` verwendet werden:

```
osmium tags-filter -o filtered.osm.xml w/upload=false input.osm.xml
```

Da das Ergebnis als XML gespeichert wurde, kann es wieder in JOSM geöffnet werden:

{{< figure src="josm.png" alt="JOSM" class="post-image" >}}

## Bildung einer Maske

Der nächste Schritt ist es aus den isolierten Änderungen eine Art Maske zu erzeugen, die dann wieder zur Filterung eines größeren Gebietes verwendet werden kann. Dieser und die folgenden Schritte wurden mit [PyOsmium](https://docs.osmcode.org/pyosmium/latest/) gemacht, zur Implementierung, siehe unten.

Bei der Bildung der Maske werden auch gleich die OSM IDs der Änderungen angepasst: Diese sind bis hier hin negativ, da sie nicht "echt" also Teil des zentralen OSM Datenbestandes sind. Allerdings mögen verschiedne Bibliotheken oder auch [Planetiler](https://github.com/onthegomap/planetiler) es nicht wenn sie negativ sind, daher werden sie einfach mit -1 multipliziert.

## Eingabedatei aufräumen

Mit der Maske lässt sich nun ein OSM Datendump aufräumen. Dabei wird der gesamte gewünschte Kartenausschnitt durchlaufen und jeder OSM weg , der die Maske überschneidet verworfen. So lassen sich bestehende Gebäude, Grünflächen  etc entfernen.

## Zusammenführung

Der letzte Schritt ist die Zusammenführung des bereinigten Gebietes mit den eigenen Änderungen.

# Ergebnis

Der nächste Schritt ist dann die Konvertierung der OSM PBF Datei in Vektorkacheln mit [Planetiler](https://github.com/onthegomap/planetiler).

Und so sehen die erzeugten Kartendaten in einem provisorischem [Maplibre JS GL](https://maplibre.org/maplibre-gl-js/docs/) Renderer aus:

{{< figure src="render.png" alt="Mapbox JS GL" class="post-image" >}}

# Implementierung

Diese Python Funktion erledigt die Schritte oben, die einzelnen Parameter:
* **`base_file`** - Der Datendump des Gesamtgebietes
* **`patch`** - Die bereinigten mit JOSM erstellten Änderungen
* **`output_file`** - die Zieldatei
* **`overwrite`** - Bestehende Dateien überschreiben (`True` | `False`)

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
