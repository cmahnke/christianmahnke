---
date: 2021-04-17T11:22:44+02:00
title: "JPEG XL"
tags:
- DigitalImages
- Projektemacher.org
- IIIF
iiifContext: http://iiif.io/api/presentation/2/context.json
outputs:
- html
- iiif-manifest
resources:
- src: "front.jxl"
  params:
    iiif: front/info.json
    hint: non-paged
    label: Vorderseite
- src: "back.jxl"
  params:
    iiif: back/info.json
    hint: non-paged
    label: Rückseite
---

Da meine Blogs auf GitHub verwaltet werden, müssen die Bilder so platzsparend wie möglich gespeichert werden...
<!--more-->

# Warum JPEG XL?

[JPEG XL](https://en.wikipedia.org/wiki/JPEG_XL) ist ein neues Format für Rasterbilder, so neu, das zur Zeit als dieser Text geschrieben wurde, es als Lemma noch nicht in der deutschen Wikipedia geführt wurde. Was genau JPEG XL anders bzw. besser macht als das allseits bekannte JPEG kann man dort nachlesen. Wir beschränken uns hier auf den Mehrwert für die Projektmacher Blogs:
* Weniger Speicherplatz benötigt
* Verlustfreie Kompression möglich

Nachteile sind derzeit noch:
* Wenig Programme können damit bisher umgehen
* Die bestehenden Algorithmen sind noch nicht optimiert - es ist also langsamer

Die Referenz-Implementierung ist auf [GitLab](https://gitlab.com/wg1/jpeg-xl) zu finden.

# Wie?

Da die Konvertierung in IIIF Derivate auf GitHub durch ein [Docker Image](https://github.com/cmahnke/iiif-action) erledigt wird, liegt es nahe dieses einfach um eine JPEG XL Unterstützung zu ergänzen. Für die eingesetzte [LibVIPS](https://github.com/libvips/libvips) gibt es ein [Pull Request](https://github.com/libvips/libvips/pull/2181), der die Unterstützung für die JPEG XL Referenz-Implementierung nachrüstet. Diese ist nun in einer Variante des Images zur Konvertierung eingebaut:

```
docker pull ghcr.io/cmahnke/iiif-action:latest-jxl
```

Es gibt auch ein  Image, dass nur die JPEG XL Referenz-Implementierung beinhaltet:

```
docker pull ghcr.io/cmahnke/jpeg-xl-action:latest
```


# Vorbereitung

## Starten eines interaktiven Containers

Das Image kann auch verwendet werden, um die Ausgangsdateien zu erstellen.

```
docker run -it -v ${PWD}:${PWD} 'ghcr.io/cmahnke/iiif-action:latest-jxl' /bin/bash -c "cd ${PWD}; $SHELL"
```

## Dateien konvertieren

Direkt `vips` zu benutzen hat den Vorteil, dass man jedes unterstützte Dateiformat benutzen kann.

```
vips copy front.tif front.jxl[Q=100]
```

Folgende Probleme sind bisher aufgetreten:

* `vips jxlsave` unterstützt keine Parameter
* Der Parameter `effort` kann zum Absturz führen, wenn er größer als `7` ist.

`cjxl` kann auch verwendet werden, allerdings sollte man dann eine verlustfrei komprimierte (z.B. PNG) Eingangsdatei verwenden:

```
cjxl front.png front.jxl
```

Die möglichen Parameter sind hier verlinkt:
* Für [`vips jxlsave`](https://github.com/libvips/libvips/blob/add-jxl/libvips/foreign/jxlsave.c)
* Für [`cjxl`](https://gitlab.com/wg1/jpeg-xl/-/blob/master/doc/man/cjxl.txt)

## Optionen

Da JPEG XL hier primär dazu dienen soll den Speicherbedarf zu senken und das bei gleicher oder höherer Qualität kommt es darauf an dies bei der Konvertierung zu berücksichtigen. Wenn möglich sollten die bearbeitet Master (also verlustfreie Bilddaten) direkt für die Erstellung der Derivate genutzt werden. Derzeit sind JPEG Dateien (ImageMagick Qualitätsstufe 95) das Ausgangsmaterial.

Für die Beurteilung der Qualität wird das Tool [`butteraugli`](https://github.com/google/butteraugli) zum Einsatz.

### Vergleichsdatei erzeugen

```
convert front.tif -quality 95 front.jpg
```

`butteraugli` kann JPEG bzw. PNG lesen.

```
vips jxlsave front.tif front.jxl --distance 1
```

## Ergebnisse

Dieser Beitrag erhebt nicht den Anspruch, die optimalsten - wenn es das Wort den gäbe - Ergebnisse zu erzielen. Zusätzlich ist der Speicherbedarf des JPEG XL Encoder sehr intensiv und kann daher nicht in vollem Umfang in der Docker Umgebung ausprobiert werden. Aus diesen Gründen gibt es an dieser Stelle keine Benchmarks, Vergleiche von Dateigrößen usw.

Grundsätzlich bleibt was eingangs bekannt war: Dateien sind bei ähnlicher Qualität kleiner.

# IIIF

Nachdem man nun ein paar JPEG XL Dateien erzeugt hat, kann man nun IIIF Derivate generieren:

```
vips dzsave front.jxl front -t 512 --layout iiif
```

{{< iiif/presentation manifestUrl="manifest.json" >}}
