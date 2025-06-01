---
date: 2025-05-28T18:22:44+02:00
title: "Wikidata Links in Hugo"
cite: true
tags:
  - Hugo
  - Wikidata
  - SPARQL
---
Ein weiterer Schritt zur leichteren Durchsuchbarkeit der Seite...
<!--more-->

Das Hugo Template unten wird bei der Übersetzung von Markdown in HTML Links verwendet. Dabei werden:
* [Wikipedia](https://www.wikipedia.org/) Links mit den entsprechen [Wikidata](https://wikidata.org/) Entitäten Identifier über die [Mediawiki-API](https://www.mediawiki.org/wiki/API:Pageprops) angereichert
* Ein Schuss ins Blaue: Wenn es sich um eine externe URL handelt (also mit `http` anfängt), wird der [Wikidata SPARQ Endpunkt](https://query.wikidata.org/sparql) abgefragt, um herauszufinden, ob die URL als `officialWebsite` (P856), `officialBlog` (P1581) oder `onlineDatabaseURL` (P1316) für eine Entität hinterlegt wurde, falls ja, wird diese Identifier verwendet.
* Wikidata Links mit einer CSS-Klasse (`wikidata`) markiert, und der Identifier hinzugefügt
* Externe Links in einem neuen Tab geöffnet


Die Datei `layouts/_default/_markup/render-link.html`:

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

Damit die SPARQL Abfrage funktioniert, muss der Medientyp in der Hugo Configuration frei geschaltet werden.

In `config.toml` oder `hugo.tml` muss die folgende Einstellung ([`security.http`](https://gohugo.io/configuration/security/#httpmediatypes)) angepasst oder ergänz werden:

```toml
[security.http]
  mediaTypes = ['^application/json$', '^application/json;\s?charset=[uU][tT][fF]-8$', '^application/sparql-results\+json;\s?charset=[uU][tT][fF]-8$']
```

## Und wofür das Ganze?

Auf diese Weise können Entitäten im Ausgangstext einfach als (Markdown-) Links ausgezeichnet werden, um dann z.B. via JavaScript während der Anzeige im Browser ausgewertet zu werden. Auch für die Indexierung können die Entitäten hilfreich sein, zB. um ihnen bei der Suche eine höhere Relevanz zuzugestehen.

Dieses CSS kann genutzt werden um die Links zu deaktivieren:
```css
a.wikidata {
  pointer-events: none;
  text-decoration: none;
  color: unset;
}
```
Natürlich müssen die Varianten für `:link` `:visited`, `:hover` und `:active` auch noch angepasst werden.

## Kann man schon was sehen?

Nein (bzw. nur im Quelltext der Seite)
