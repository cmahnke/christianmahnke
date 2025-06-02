---
date: 2025-05-30T17:33:44+02:00
title: "Extending Pagefind"
keywords: Pagefind
description: ""
cite: true
tags:
  - Search
  - Pagefind
  - JSON
---

Da diese Seite eine Suche braucht, habe ich mir mal [Pagefind](https://pagefind.app/) angesehen...
<!--more-->
...und auch wenn ich ursprünglich Vorbehalte zu der Integrierbarkeit und Flexibilität hatte, hat mich ein sehr guter Freund (und die Vorteile) dann doch dazu bewogen es mal zu probieren.

Die Vorteile sind recht einfach:   
Meine Seiten sind grundsätzlich statisches HTML, dynamische Inhalte werden ausschließlich im Client in JavaScript (oder TypeScript) realisiert. Daher muss auch eine Suche ohne einen klassischen Suchserver wie [Solr](https://solr.apache.org/) oder [ElasticSearch](https://www.elastic.co/elasticsearch) auskommen.  
Bisher nutze ich für die [Projektemacher Suche](https://projektemacher.org/search/) [Fuse.js](https://www.fusejs.io/), dafür wird der gesamte Index in einer JSON Datei gespeichert und immer komplett an den suchenden Client übertragen. Eine andere JavaScript Suche, die auch so funktioniert, ist [Lunr.js](https://lunrjs.com/).  
Das macht die Indexierung selber recht schnell, skaliert aber nicht so richtig, wenn man viele Seiten indexieren will, da die Größe der zu übertragenden Daten mit der Menge der Seiten linear skaliert. Auch hier gibt es eine Lösung, um die zu übertragende Datenmenge zu reduzieren, siehe [Beitrag über JSON Komprimierung](/post/json-compression/), aber am Ende braucht der (ggf. mobile) Client doch wieder alle Daten im Arbeitsspeicher.

Pagefind arbeitet an dieser Stelle anders, es werden nur die jeweils benötigten Fragmente des Indexes übertragen. Eine genauere Beschreibung ist auf der Homepage zu finden.  
Dazu kommen die relativ umfangreichen Möglichkeiten den Index anzureichern, die auch für diese Seite zum Einsatz kommen sollen.

Aus meiner Sicht ist der größte Nachteil eine recht fragwürdige Designentscheidung zur Konfigurierbarkeit: Das, was man klassisch als Index-Felder kennt, wird in Pagefind über HTML data Attribute (also ungefähr so flexibel bzw. cool wie Inline-CSS) oder die Nutzung der API realisiert. Eine einfache externe Konfigurationsdatei ist (bisher) nicht vorgesehen.

## Pagefind Konfiguration

Über die data Attribute können die folgenden Einstellungen vorgenommen werden, grob kann man dabei zwischen Markern und bespielbaren Feldern unterscheiden. Alle beginnen mit `data-pagefind-`, hier für die Übersichtlichkeit weggelassen:

* Marker  
  * `body` - Der zu indizierende Inhalt  
  * `ignore` - Elemente, die man ignorieren kann, z.B. Header, Footer und Menüs, kann optional auch einen Parameter bekommen  
* Feldkonfiguration  
  * `index-attrs` - Attribute, die indexiert werden sollen
  * `weight` - Gewichtung eines Elements
  * `meta` - Zusätzliche Metadaten für ein Dokument, kann Autoren
      * `image` - Metadaten über Bilder
      * `title` - Das Element für den Titel  
  * `filter` - Filter, kann z.B. für Tags genutzt werden

## Externe Konfiguration

Da die Konfiguration elementspezifisch ist, lässt sie sich recht einfach vom Eingabedokument trennen. Der Vergleich zum Inline-CSS oben ist nicht zufällig gewählt, da CSS Selektoren das Mittel der Wahl sind, um auch hier Inhalt und Indexierung (-sanweisungen) sauber zu trennen. Alles, was es braucht, ist eine Datenstruktur, die beides verbindet. Und hierin liegt das Neuartige im vorgestellten Ansatz.

Die Grundsätzliche Struktur ist relativ simpel: Pro Option oben kann eine Liste von CSS Selektoren vergeben werden und je nach Art (siehe oben) können dazu dann Parameter angegeben werden.

Diese Beispiel veranschaulicht die Zuordnung:

```yaml
files:
  output: docs/index
  source: docs
  include:
    - '**/*.htm'
    - '**/*.html'
  exclude:
    - 'tags/**'
    - 'en/tags/**'
    - 'post/page/*/**'
    - 'en/post/page/*/**'
    - 'search/**'
    - 'en/search/**'
content:
  ignore:
    - "<meta http-equiv=\"refresh\" content=\"0; url="
index:
# Tagging attributes
  body:
    - .content-container
  ignore:
    - header.header
    - footer.footer: all
    - script: all
    - "div.menu": all
  weight:
    - "h1": 7.0
    - "h2": 6.0
    - "h3": 5.0
    - "a[data-wikidata-entity]": 5.0
    - "h4": 4.0
    - "h5": 3.0
    - "h6": 2.0
# Index fields
  meta:
    author: 'meta[name="author"]'
    wikidata:
      - "a[data-wikidata-entity]": "[data-wikidata-entity]"
    variants:
      - "a[data-wikidata-entity]":
          function: variants
          args:
            lang: "{lang}"
    title:
      - h1.post-title
      - ".section-head h1.section-head-title"
    date:
      - ".date time": "[datetime]"
    selector:
      - "p, h1, h2":
          function: generate_css_selector
    image:
      - ".gallery .gallery-image.caption": "[href]"
      - "figure img": "[src]"
  sort:
    date:
      - ".date time": "[datetime]"
  filter:
    tag:
      - ".meta .tags a":
          function: extract
          args:
            pattern: "s/#(.*)/$1/g"
    section:
      - body:
          function: extract
          args:
            attribute: "class"
            pattern: "s/.*section-(.[^ ]*).*/$1/g"

  index-attrs:
    a: "[data-wikidata-entity]"
```

Neben der schon erläuterten allgemeinen Funktionsweise, werden auch ein paar Besonderheiten deutlich:

* Allgemeine Konfiguration von Verzeichnissen und Muster zum Inkludieren und Exkludieren der zu indizierenden Dateien
* Inhaltsbasierte Filter für Inhalte, hier genutzt um Redirects auszuschließen
* Gewichtungen werden auch für Elemente mit bestimmten Attributen vergeben  
* Zusätzliche Funktionen - Diese ermöglichen es Dokumente mit zusätzlichen Daten anzureichern. Beispiele können ein generierter CSS Selektor, der nur das Eingangselement adressiert, oder Typisierungen von Entitäten sein, sein

## Implementierung

Die Beispielimplementierung nutzt die Python API von Pagefind, hauptsächlich, da ich schon Erfahrungen mit der Python Bibliothek [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/) habe, die für die Selektion mittels CSS Selektoren verwendet wird.

<details>
  <summary>Gist</summary>
  {{< html/iframe-consent >}}
      {{<gist cmahnke 5049d42cd6dabc19cfd6c85161947fa2 >}}
  {{< /html/iframe-consent >}}
<details>

## Ausblick

Die Trennung von zu indizierenden Inhalten und der Konfiguration des Indexes erlaubt nun ein paar einfache Erweiterungen, die die (Nach-)Nutzbarkeit der Software massive erhöhen könnten:

* **Inline Callbacks für CSS Selektoren**
  Wenn es möglich ist, für über CSS Selektoren gefundene Elemente Funktionen bzw. Callbacks auszuführen, könnten diese auch den Index weiter anreichern. Diese Callbacks könnten natürlich ausgetauscht werden, so ließen sich einfache Preprocessing Pipelines realisieren, wie man sie z.B. von [ElasticSearch](https://www.elastic.co/docs/reference/enrich-processor/pipeline-processor) kennt
* **Mehrere Ausgabedokumente für ein Eingangsdokument**
  Es ist auch denkbar, dass man für ein Eingangsdokument mehrerer zur Indexierung erstellt. Da hat den Vorteil, dass man auch einzelne Dokumentfragmente durchsuchen und adressieren kann.

Wäre die Konfiguration in JavaScript (statt YAML oder JSON) realisiert, könnten die Callbacks / Plugins auch direkt inline definiert oder importiert werden.
