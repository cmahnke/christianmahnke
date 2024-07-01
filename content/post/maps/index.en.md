---
date: 2023-01-01T20:14:44+02:00
title: "Maps for my Projektemacher blogs"
tags:
- maps
- Projektemacher
---

Another addition from [Projektemacher Labs](https://labs.projektemacher.org/):

# Preparations

Before posts can be displayed on maps, the following steps must be taken:
* Geocoding of posts and / or tags
* Generation of an application-specific representations (GeoJSON, KML)

After this has been done, the next step can be approached.

An example of the [old 3D images](/future/3d/) can be found [here](/future/3d/map.geojson).

# Plotting data on a map in a browser

The map material provided by [OpenStreetMap](https://www.openstreetmap.org/) can be used to display the generated data in the browser. An external server generates the images needed to display a map.

This example shows the locations of the 3D images on a map:

{{< html/iframe-consent >}}
    {{< maps/osm src="/post/maps/map.geojson" >}}
{{< /html/iframe-consent >}}

**Update**: The example shows posts for [VintageReality](https://vintagereality.projektemacher.org/).

# Next steps

Now only the last step is missing, generating your own map material in order to be independent of external services and also to have the possibility to change the appearance...

# Follow-ups:
* **14.11.2023**: [Backsteinexpressionismus: Added Map](https://backsteinexpressionismus.projektemacher.org/lists/#karte)
* **21.3.2024**: [Kleiderbügel: Added Map](https://xn--kleiderbgel-0hb.xn--blaufusstlpel-qmb.de/map/)
