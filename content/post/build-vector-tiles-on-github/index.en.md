---
date: 2023-07-01T20:14:44+02:00
title: "Build vector maps with GitHub"
class: toc-text
cite: true
tags:
- Projektemacher.org
- Geodata
- GitHub
- Docker
---
Since the use of freely available map services requires [communication with external services](/post/maps/) as well as limited design, it was time for something of my own...

<!--more-->
{{< toc >}}

## Vector tiles

Map materials on the web are usually organised in tiles according to zoom level and coordinates to enable access via a URL scheme. The format (pixels or vectors) is initially irrelevant. Viewers such as OpenLayers or Leaflet can work with both formats.  
The [vector format](https://github.com/mapbox/vector-tile-spec/tree/master/2.1) has the advantage that the display can be customised at runtime in the client. Examples include the thickness of roads, the colour of land areas, etc. It is also possible to simply switch off entire layers. And the whole thing can also be customised according to different zoom levels.  
There are two common conventions for styling vector tiles:

* [Mapbox Styles](https://docs.mapbox.com/style-spec/guides/)  
* [MapLibre Styles](https://maplibre.org/maplibre-style-spec/)

These allow the creation of the map material to be decoupled from the planned display. And this is a great advantage if you potentially have several blogs, each of which has its own design and should also be reflected in the map material.  
To apply the styles to vector tiles, there is a plugin, e.g. for [OpenLayers](https://github.com/openlayers/ol-mapbox-style).

## Planetiler

[Planetiler](https://github.com/onthegomap/planetiler) is a tool for generating vector tiles from OpenStreetMap data. Compared to other tools of this kind, it has the advantage of being able to work directly with the data dumps and not having to take the diversions via a database import. This not only means fewer transformation processes, but also greater efficiency in the utilisation of the available resources. At the same time, the configuration options are very extensive. For example, various layers can simply be ignored, such as house numbers, landmarks or air traffic routes.

## Prepare GitHub Runner

### Limitations

Since the OpenstreetMap raw data is very extensive and the process also requires a lot of additional temporary data, a (relatively) large contiguous memory area is required. Although the standard GitHub runners are relatively well equipped, a large number of runtime environments and libraries are pre-installed in order to be able to serve many use cases without additional effort. In addition, the distribution between virtual ‘hard disks’ (mount points) is rather suboptimal for our purposes...

**In addition, the runtime of a runner is limited: It is terminated after 6 hours at the latest**.

### Creating resources

The problems with the available memory can be solved during the runtime of the runner with actions and, if necessary, your own scripts: So delete / uninstall software and repartition the runner a little. There is a GitHub action for this, [`maximise-build-space`](https://github.com/easimon/maximize-build-space).

However, you may have to customise the repartitioning according to your own requirements. However, the procedure is always similar: deactivate the swap area ([`swapoff`](https://linux.die.net/man/8/swapoff)), unmount the areas to be edited ([`umount`](https://linux.die.net/man/8/umount)), delete the corresponding logical volumes (including the volume group if necessary), delete any loopback devices and create new ones if necessary. Then create a new logical volume (possibly a volume group beforehand)...  
It is also possible to create files on different volumes, include them as loopback devices and then combine them into a logical storage area using [LVM](https://sourceware.org/lvm2/).

Regardless of the desired memory layout, a new swap area must be created and activated at the end, as Planetiler requires more memory than the runner offers. The use of `fallocate` is recommended for the area, as this allocates the maximum available space in advance and thus prevents the area from having to grow. The expected memory requirement can be determined with local experiments: If you need 4G for Planetiler (start with `java -Xmx4g`), the swap area should also be correspondingly large.

However, it is important to ensure that not too much is deleted: If, for example, you need a runtime environment up to a certain stage in the process, it can of course not be deleted immediately. It is also a good idea to delete docker images specifically. And, if possible, you should not simply delete programme files or directories, but uninstall them using package management, as this is then able to remove dependencies that are no longer required.

In order to make the best possible use of the available runtime, it is also possible to outsource various preparation steps or carry them out in a different context. This can be achieved by creating a Docker image that not only contains Planetiler, but also the [data](https://github.com/onthegomap/planetiler/blob/main/NOTICE.md#data) required independently of the map to be created, such as boundaries, coastlines / waterlines and any additional tools (see below).

## Generate your own map sections

Since Planetiler (as well as other services based on OpenStreetMap) uses the [GeoFabrik](https://download.geofabrik.de/) map sections, you are initially limited to the corresponding sections (countries, larger administrative units such as federal states or provinces). This may be somewhat less than would be desirable (examples could be maps of Central Europe or historical regional authorities).  
In this case, you must first prepare the input material before creating vector tiles. Of course, this can also be done on a Runner, but it takes up a lot of time: both the download and the merging take time.  
Roughly speaking, the workflow is as follows:

1. download the desired sections, ideally overlapping  
   Osmium is able to deduce points, but paths remain cut off.   
2. merge  
   It may be advisable to merge the sections incrementally, as this allows you to delete the original data after each merge.  
3. cropping (optional)  
   To guarantee continuous quality in a rectangle, it is advisable to crop the input material.

### Clean up data

In addition, data can also be cleaned up before processing, e.g. the buildings can be removed from the dumps, which saves a lot of time and storage space.  
It is also possible to remove individual or classes of OSM tags before processing. As a rule of thumb, the smaller the source material, the faster the process. However, the time required for filtering is also proportional to the size of the data dump, so it is not worthwhile for tags with few occurrences. Here you can either experiment or use [OSM-Taginfo](https://taginfo.openstreetmap.org/) for an estimation. However, as the building data make up by far the largest part of a dump, it is always worth removing them (unless, of course, they are to be shown, in which case a further restriction is recommended, e.g. to listed buildings).

The following tools are suitable for pre-processing (merging and filtering):

* [Osmium](https://osmcode.org/osmium-tool/)  
* [Osmfilter](https://wiki.openstreetmap.org/wiki/Osmfilter)

Merging and cleansing can also be combined; `osmium` can also filter data, but is somewhat slower.

## Creating the tiles

Once you have prepared the data for the desired map section, you can transfer it to Planetiler.  
As Planetiler saves the tiles in a single file in [`mbtiles`](https://wiki.openstreetmap.org/wiki/MBTiles) format, this can be extracted again immediately before further processing if you still have some runtime as a buffer. This can be done using the Python script [`mbutil`](https://github.com/mapbox/mbutil), for example.

## Extraction of the generated data

Once you have generated the tiles, you are faced with another problem: How do you get them out of the runner again? What sounds trivial at first is actually quite limited by the maximum size for GitHub artefacts. This is only 2 GB.  
But GitHub allows a loophole: the limit does not apply to Docker images. Packaging therefore simply takes place as an image, which also offers advantages for further processing. However, this immediately leads to the next problem: Docker itself first copies the entire context in order to build an image from it, which means that you need three times the storage space at the end (source files, cache and the final image). This is remedied by the alternative implementation [Buildah](https://buildah.io/) (Redhat offers a corresponding [GitHub Action](https://github.com/redhat-actions/buildah-build)), which now requires the space for the input material and the final image. The generated image can then be pushed into the container registry using the [`push-to-registry` GitHub Action](https://github.com/redhat-actions/push-to-registry).

Combinations are also possible here, so in order to be able to work on a very empty runner, the above steps can also be carried out in a build with a specialised base image that contains not only the necessary data but also programs.

## Next steps

There is still some potential for optimisation: it is conceivable to compile Planetiler natively using [GraalVM](https://www.graalvm.org/), which would have the advantage that the runtime would be reduced by a maximum of 30% and the memory space for the Java runtime environment could be eliminated. However, there are still a few small hurdles to overcome, as the current way of using the native functionality of the operating system is not compatible with GraalVM.

It is also conceivable to provide some of the always necessary steps as a separate GitHub action, but so far it is not worth the effort for me.

## Can you see anything yet?

This article intentionally does not contain any configuration and code examples, as the actual execution must be strongly tailored to the desired map material due to the limited resources.

Roughly speaking, you can create the dump for Europe without buildings up to zoom level 13 in just under 6 hours using all the tricks.

## Update

* **14.3.2025**: [Never Built Göttingen: Map based on self-generated material](https://never-built.goettingen.xyz/map/)
