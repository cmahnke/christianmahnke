---
date: 2025-11-02T15:22:44+01:00
title: "Shared metadata for Hugo pages"
cite: true
tags:
  - Hugo
---

Shared content for multiple Hugo pages...
<!--more-->

For my collections (and also for this site), I use [Hugo](https://gohugo.io/). In collections with similar objects, it often happens that information about several objects is identical. An example from the blog about brick expressionism:
* [Calendar 1934 – Hannoverscher Anzeiger](https://backsteinexpressionismus.projektemacher.org/post/kalender-1934-hannoverscher-anzeiger/)
* [Die deutsche Zeitung – Its Development, Nature and Impact: Anzeiger Hochhaus Hannover](https://backsteinexpressionismus.projektemacher.org/post/die-deutsche-zeitung/anzeiger-hochhaus/)

In the examples, the architect and links to Wikipedia and other directories are listed under "Additional information" ("Zusätzliche Informationen"). In addition, the geocoordinates for the map display are also stored centrally. This also applies to [Wikidata links](https://www.wikidata.org/wiki/Wikidata:Main_Page).

In this case, **centrally** means that the respective data is not part of the respective pages, but is stored in the pages for the tags (in Hugo Term Pages). The template responsible for creating the respective page pulls the information from there:

```yaml
#content/tags/Anzeiger-Hochhaus/_index.md
---
title: "Anzeiger Hochhaus"
description: ''
type: building
archinformID: projekte/7497
location: Hannover
yearBuild: 1927-1928
geojson:
  coordinates:
  - 9.7293844
  - 52.3770514
---

* Entworfen von [Fritz Höger](/tags/Fritz-Höger)

# Das Anzeiger Hochhaus in der...
* [Wikipedia](https://de.wikipedia.org/wiki/Anzeiger-Hochhaus)
* [Internationalen Architektur-Datenbank](https://deu.archinform.net/projekte/7497.htm)
* [Internationalen Datenbank und Galerie für Ingenieurbauwerke (Structurae)](https://structurae.net/de/bauwerke/anzeigerhochhaus)
```

The following fragment comes from the template for displaying a page or object:
```go-html-template
{{- range $tag := .Params.tags -}}
  {{- $tagUrl := printf "%s%s" "tags/" ($tag | urlize) -}}
  {{- $tagPath := (urls.Parse $tagUrl).Path -}}

  {{- with site.GetPage $tagPath -}}
    {{- .Content -}}
  {{- end -}}
{{- end -}}
```

When revising the [clothes hanger page (Kleiderbügel)](https://xn--kleiderbgel-0hb.xn--blaufusstlpel-qmb.de/), I wanted to avoid storing information that should be displayed on more than one page multiple times. The difference to the example above, however, is that some of the hangers were manufactured before 1945 and the printed place name therefore no longer corresponds to today's name, as some places are now part of Poland. One could ignore this and use the old German place names, but this would have politically questionable implications.

Therefore, an additional requirement was that some tags (those of the old German place name) should be displayed, but always as a redirect to the tag of the current name. While this is fairly easy to do for the list view by implementing the old name as an alias, it is a problem when you need the linked information in a post.

```yaml
#content/tags/szczecin/_index.md
---
title: Szczecin / Stettin
aliases:
  - /tags/stettin
params:
  type: place
  wikidata: Q393
---
```

In the end, the solution was quite simple: if the page for the tag cannot be retrieved, simply search for the alias and include the page that contains it:

```go-html-template
{{- range $tag := .Params.tags -}}
  {{- $tagUrl := printf "%s%s" "tags/" ($tag | urlize) -}}
  {{- $tagPath := (urls.Parse $tagUrl).Path -}}

  {{- with site.GetPage $tagPath -}}
    {{- .Content -}}
  {{- else -}}
    {{- $termPages := where site.AllPages ".Kind" "eq" "term" -}}
    {{- $alias := printf "/%s" $termPath -}}
    {{- $termPages = where $termPages ".Aliases" "intersect" (slice $alias) -}}

    {{- with index $termPages 0 -}}
      {{- .Content -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
```

## Thanks

Thanks to [***irkode***](https://discourse.gohugo.io/u/irkode/summary) from the Hugo Forum, who [helped me find the solution](https://discourse.gohugo.io/t/assign-multiple-slugs-to-one-file-page/56175/4).
