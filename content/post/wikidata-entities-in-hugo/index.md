---
date: 2025-05-28T18:22:44+02:00
title: "Wikidata Links in Hugo"
tags:
  - Hugo
  - Wikidata
---
Ein weiterer Schritt zur leichteren Durchsuchbarkeit der Seite...
<!--more-->

Das Hugo Template unten wird bei der Übersetzung von Markdown in HTML Links verwendet. Dabei werden:
* [Wikipedia](https://www.wikipedia.org/) Links mit den entsprechen [Wikidata](https://wikidata.org/) Entitäten Identifier über die [Mediawiki-API](https://www.mediawiki.org/wiki/API:Pageprops) angereichert
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
