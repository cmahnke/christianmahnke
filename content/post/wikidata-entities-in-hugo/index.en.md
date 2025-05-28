---
date: 2025-05-28T18:22:44+02:00
title: "Wikidata Links in Hugo"
tags:
  - Hugo
  - Wikidata
---
Another step towards easier searchability of the site...
<!--more-->

The Hugo template below is used when translating Markdown to HTML links. It uses:
* [Wikipedia](https://www.wikipedia.org/) links are enriched with the corresponding [Wikidata](https://wikidata.org/) entity identifiers via the [Mediawiki API](https://www.mediawiki.org/wiki/API:Pageprops)
* Wikidata links marked with a CSS class (`wikidata`), and the identifier added
* External links opened in a new tab


The file `layouts/_default/_markup/render-link.html`:

```go-html-template
{{- $target := .Destination -}}
{{- $wikidataID := "" -}}
{{- if findRE `(?m)https://(.{2}).wikipedia.org/wiki/(.[^#]*)` $target -}}
  {{- $queryURL := replaceRE `(?m)https://(.{2}).wikipedia.org/wiki/(.[^#]*)` "https://$1.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=$2&format=json" $target -}}
  {{- with try (resources.GetRemote $queryURL) -}}
    {{- with .Err -}}
      {{- errorf "Unable to get remote resource %s: %s"  $queryURL . -}}
    {{- else with .Value -}}
      {{- $data := .Content | transform.Unmarshal -}}
      {{ $keys := slice }}
      {{ range $k, $_ := $data.query.pages }}
        {{ $keys = $keys | append $k }}
      {{ end }}
      {{- $pageMeta := index $data.query.pages (first 1 $keys) -}}
      {{- $wikidataID = $pageMeta.pageprops.wikibase_item -}}
    {{- else -}}
      {{- errorf "Unable to get remote resource %s" $queryURL -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
{{- if or (hasPrefix $target "https://www.wikidata.org/wiki/") (hasPrefix $target "https://www.wikidata.org/entity/") -}}
{{- $wikidataID = replaceRE `(?m)https://www.wikidata.org/wiki/(.*)` "$1" $target -}}
<a class="wikidata" {{ if ne $wikidataID "" }}data-wikidata-entity="{{ $wikidataID }}" {{ end }}href="{{ .Destination | safeURL }}"{{ with .Title}} title="{{ . }}"{{ end }}{{ if strings.HasPrefix .Destination "http" }} target="_blank"{{ end }}>{{ .Text | safeHTML }}</a>
{{- "" -}}
{{- else -}}
<a {{ if ne $wikidataID "" }}data-wikidata-entity="{{ $wikidataID }}" {{ end }}href="{{ .Destination | safeURL }}"{{ with .Title}} title="{{ . }}"{{ end }}{{ if strings.HasPrefix .Destination "http" }} target="_blank"{{ end }}>{{ .Text | safeHTML }}</a>
{{- "" -}}
{{- end -}}
```

## And what is it all for?

In this way, entities in the source text can simply be labelled as (markdown) links in order to then be evaluated via JavaScript during display in the browser, for example. The entities can also be helpful for indexing, e.g. to give them a higher relevance in the search.

This CSS can be used to deactivate the links:
```css
a.wikidata {
  pointer-events: none;
  text-decoration: none;
  colour: unset;
}
```
Of course, the variants for `:link` `:visited`, `:hover` and `:active` also need to be adapted.

## Can you see anything yet?

No (or only in the source code of the page)
