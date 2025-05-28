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
* A shot in the dark: If it is an external URL (i.e. starts with `http`), the [Wikidata SPARQ endpoint](https://query.wikidata.org/sparql) is queried to find out whether the URL has been stored as `officialWebsite` (P856), `officialBlog` (P1581) or `onlineDatabaseURL` (P1316) for an entity, if so, this identifier is used.
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
{{- else if hasPrefix $target "http" -}}
  {{- $queryURL := "https://query.wikidata.org/sparql" -}}
  {{- $queryOpts := dict
    "method" "get"
    "headers" (dict "Accept" "application/sparql-results+json")
  -}}
  {{- $query := printf `SELECT ?item ?itemLabel ?officialWebsite ?officialBlog ?onlineDatabaseURL WHERE {
      ?item wdt:P856 <%s> . SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" . }
      OPTIONAL { ?item wdt:P856 ?officialWebsite . } OPTIONAL { ?item wdt:P1581 ?officialBlog . } OPTIONAL { ?item wdt:P1316 ?onlineDatabaseURL . }
    }` $target -}}
  {{- $queryURL = printf "%s?query=%s" $queryURL (urlquery $query) -}}
  {{- with try (resources.GetRemote $queryURL $queryOpts) -}}
    {{- with .Err -}}
      {{- errorf "Unable to get remote resource %s: %s"  $queryURL . -}}
    {{- else with .Value -}}
      {{- $data := .Content | transform.Unmarshal -}}
      {{- if and (reflect.IsMap $data.results) (isset $data.results "bindings") (reflect.IsSlice $data.results.bindings) (gt (len $data.results.bindings) 0) -}}
        {{- $result := index $data.results.bindings 0 -}}
        {{- $wikidataID = replaceRE `(?m)https://www.wikidata.org/entity/(.*)` "$1" $result.item.value -}}
      {{- end -}}
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

For the SPARQL query to work, the media type must be enabled in the Hugo configuration.

The following setting ([`security.http`](https://gohugo.io/configuration/security/#httpmediatypes)) must be adjusted or added in `config.toml` or `hugo.tml`:

```toml
[security.http]
  mediaTypes = ['^application/json$', '^application/json;\s?charset=[uU][tT][fF]-8$', '^application/sparql-results\+json;\s?charset=[uU][tT][fF]-8$']
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
