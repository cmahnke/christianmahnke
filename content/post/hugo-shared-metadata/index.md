---
date: 2025-11-02T15:22:44+01:00
title: "Geteilte Metadaten für Hugo Seiten"
cite: true
tags:
  - Hugo
---

Gemeinsame Inhalte für mehrere Hugo Seiten (das "Hugo Geteilte Metadaten Entwurfsmuster")...
<!--more-->

Für meine Sammlungen (und auch für diese Seite) benutze ich [Hugo](https://gohugo.io/). Bei Sammlungen mit ähnlichen Objekten kommt es häufig vor, dass Informationen zu mehreren Objekten identisch sind. Ein Beispiel aus dem Blog über Backsteinexpressionismus:
* [Kalender 1934 - Hannoverscher Anzeiger](https://backsteinexpressionismus.projektemacher.org/post/kalender-1934-hannoverscher-anzeiger/)
* [Die deutsche Zeitung - Ihr Werden, Wesen und Wirken: Anzeiger Hochhaus Hannover](https://backsteinexpressionismus.projektemacher.org/post/die-deutsche-zeitung/anzeiger-hochhaus/)

In den Beispielen werden unter "Zusätzliche Informationen" der Architekt und Links in die Wikipedia und andere Verzeichnisse aufgeführt. Zusätzlich sind auch die Geokoordinaten für die Kartendarstellung zentral hinterlegt. Dies gilt auch für [Wikidata-Links](https://www.wikidata.org/wiki/Wikidata:Main_Page).

**Zentral** bedeutet in diesem Fall, dass die jeweiligen Daten gar nicht Teil der jeweiligen Seiten sind, sondern in den Seiten zu den Tags (in Hugo Term-Pages) hinterlegt sind. Das Template, das für die Erstellung der jeweiligen Seite zuständig ist, zieht sich die Informationen von dort:

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

Das folgende Fragment stammt aus dem Template für die Anzeige einer Seite bzw. eines Objektes:
```go-html-template
{{- range $tag := .Params.tags -}}
  {{- $tagUrl := printf "%s%s" "tags/" ($tag | urlize) -}}
  {{- $tagPath := (urls.Parse $tagUrl).Path -}}

  {{- with site.GetPage $tagPath -}}
    {{- .Content -}}
  {{- end -}}
{{- end -}}
```

Es ist natürlich auch möglich andere Parameter (im Beispiel `geojson`) aus der zentralen Datei zu extrahieren, daher nenne ich diesen Ansatz das "Hugo Geteilte Metadaten Entwurfsmuster".

Bei der Überarbeitung der [Kleiderbügel-Seite](https://xn--kleiderbgel-0hb.xn--blaufusstlpel-qmb.de/) wollte ich vermeiden, Informationen, die auf mehr als einer Seite angezeigt werden sollen, mehrfach zu hinterlegen. Der Unterschied zu dem Beispiel oben ist allerdings, dass einige der Bügel vor 1945 hergestellt wurden und der aufgedruckte Ortsname daher nicht mehr dem heutigen entspricht, da manche Orte heute Teil von Polen sind. Nun könnte man das ignorieren und die alten deutschen Ortsnamen verwenden, was jedoch einen politisch fragwürdigen Beigeschmack hätte.

Daher war eine zusätzliche Anforderung, dass manche Tags (die des alten deutschen Ortsnamens) zwar angezeigt werden, aber immer als Weiterleitung auf das Tag des aktuellen Namens. Während das für die Listenansicht ziemlich einfach ist, indem man den alten Namen als Alias realisiert, ist das ein Problem, wenn man in einem Beitrag die verknüpften Informationen braucht.

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

Die Lösung war am Ende recht einfach: Wenn sich die Seite zu dem Tag nicht abrufen lässt, einfach nach dem Alias suchen und die Seite inkludieren, die es beinhaltet:

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

## Dank

Dank an [***irkode***](https://discourse.gohugo.io/u/irkode/summary) aus dem Hugo Forum, der mich bei der Lösung [unterstützt hat](https://discourse.gohugo.io/t/assign-multiple-slugs-to-one-file-page/56175/4).
