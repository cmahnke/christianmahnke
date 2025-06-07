---
date: 2024-01-30T18:22:44+02:00
title: "Metadaten für Hugo Shortcodes"
cite: true
tags:
  - Hugo
---

Für meine Blogs benutze ich ein Hugo Theme als eine Art Funktionsbibliothek...
<!--more-->

... dazu gehören natürlich auch einige Shortcodes. Und wenn diese z.B. JavaScript Funktionalität benötigen, war e bisher so, dass diese einfach in ein großes Bundle integriert wurde. Völlig egal, ob der Shortcode diese auf einer einer Seite brauchte, es wurde immer ausgeliefert...

Keine besonders skalierbare Lösung, besonders nicht, wenn der der Shortcode nie zum Einsatz kommt. Der normale Weg dies Problem in Hugo zu lösen ist ein Flag, das der Shortcode setzt und das dann bei der Generierung des HTML Headers ausgewertet wird. Hier ein ähnliches Beispiel aus der [Dokumentation](https://gohugo.io/content-management/diagrams/):

Als Teil des Shortcodes (Statt [`.Page.Store`](https://gohugo.io/methods/page/store/) sieht man auch manchmal das ältere [`.Scratch`](https://gohugo.io/methods/page/scratch/)):
```go-html-template
{{ .Page.Store.Set "hasMermaid" true }}
```

Als Teil des Templates, dass den HTML Header erstellt:
```go-html-template
{{ if .Store.Get "hasMermaid" }}
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>
{{ end }}
```

Aber gerade für eine Funktionsbibliothek (bzw. generell) ist das keine gute / elagante Lösung, da so die Shortcodes und das Header Template hart miteinander verknüpft werden. Daher erfordern neue Shortcodes immer Anpassungen an den Templates. Wäre es nicht schöner, wenn die Informationen zu den benötigten Scripts und Stylesheets direkt bei dem Shortcode hinterlegt werden könnte?

## Shortcodes erweitern

Da Shortcodes einfach nur Templates sind, kann man auch so ziemlich alles darin machen, z.B. weitere Templates definieren, hier die Datei `/layouts/shortcodes/toc.html`:

```go-html-template
<div class="toc">
  <div class="toc-header">{{ i18n "toc" }}</div>
  {{- .Page.TableOfContents -}}
</div>

{{- define "_partials/shortcodes/toc-metadata.html" -}}
  {{- (dict "css" slice "js" slice "scss" (slice "scss/toc.scss")) | jsonify -}}
{{- end -}}
```

Der wichtige Teil ist hier die Definition eines zusätzlichen Templates (`define`), dieses folgt einer Namenskonvention, damit es wieder auffindbar ist:
* Das Template wird im virtuellen Verzeichnis `_partials/shortcodes/` hinterlegt
* Der Name ist der des Shortcodes / Templates (`toc`), gefolgt von `-metadata.html`

Der Shortcode definiert eine einfache Datenstruktur in der Form (als YAML):

```yaml
css:
  -
js:
  -
scss:
  -
```

Diese Struktur wird als JSON serialisiert, damit man sie einfach als String übergeben kann, letzteres ist vermutlich optional.

## Shortcode-Metadaten auswerten

Das oben ist aber nur die Hälfte, irgendwie müssen die Daten dann auch bei der Generierung des HTML Headers, oder der jeweiligen Dateien (CSS und JavaScript) zur Verfügung stehen.

Da man nur prüfen kann, ob ein Shortcode auf einer Seite verwendet wird, braucht es zuerst eine Liste aller genutzten Shortcodes, dieser kann man dann auch gleich als Cache nutzen, um später weniger oft in die benötigten Seiten und Templates schauen zu müssen.

```go-html-template
{{- $includes := dict -}}
{{- $shortcodeTags := slice -}}
{{- range $page := $.Site.Pages -}}
  {{- with $page.File -}}
    {{- $matches := findRESubmatch `{{[<%]\s*([^\s]*)\b.*\s*[%>]}}` $page.RawContent -}}
    {{- $matches = (partial "shortcodes/shortcode-helper-extract-matches.html" (dict "matches" $matches) ) -}}
    {{- if $matches -}}
      {{- $shortcodeTags = $shortcodeTags | append $matches -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
{{/* Remove shortcodes starting with '/' */}}
{{- $shortcodes := slice -}}
{{- range $tag := $shortcodeTags -}}
  {{- if not (hasPrefix $tag "/") -}}
    {{- $shortcodes = $shortcodes | append $tag -}}
  {{- end -}}
{{- end -}}
{{/* Remove any duplicates */}}
{{- $shortcodes = $shortcodes | uniq -}}

{{- $candidates := slice -}}
{{- range $shortcode := $shortcodes -}}
  {{/* Find definition of each found shortcode, this way we can make sure to include the ones defined by any theme */}}
  {{- $shortcodeFile := printf "layouts/shortcodes/%s.html" $shortcode -}}
  {{- if fileExists $shortcodeFile -}}
    {{- $shortcodeContent := readFile $shortcodeFile -}}
    {{/* Get the inline partial returning the required metadata for the shortcode */}}
    {{- $matches := findRESubmatch `{{-?\s*define\s*"(.*-metadata.*)"\s*-?}}` $shortcodeContent -}}
    {{- $template := (partial "shortcodes/shortcode-helper-extract-matches.html" (dict "matches" $matches) ) -}}
    {{- if (len $template) -}}
      {{- $template = index $template 0 -}}
      {{/* Changed for Hugo 0.146.0 */}}
      {{- $template = replace $template "_partials/" "" -}}
      {{- $include := unmarshal (partialCached $template .) -}}
      {{- if isset $include "js" -}}
        {{- if eq (printf "%T" (index $include "js")) "string" -}}
          {{- $include = merge $include (dict "js" (slice (index $include "js"))) -}}
        {{- end -}}
      {{- else -}}
        {{- $include = merge $include (dict "js" slice) -}}
      {{- end -}}

      {{/* ... */}}

      {{- $includes = merge $includes (dict $shortcode $include) -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
{{/* Return a JSON containing all shortcodes and their required includes */}}
{{- $includes | jsonify }}

{{/* Can also be a seperate file */}}
{{- define "_partials/shortcodes/shortcode-helper-extract-matches.html" -}}
  {{- $matches := .matches -}}
  {{- $rMatches := slice -}}
  {{- range $matches -}}
    {{- $rMatches = $rMatches | append (index . 1) -}}
  {{- end -}}
  {{- return $rMatches -}}
{{- end -}}
```

Die resultierenden Datenstruktur hat nun den Vorteil, dass alle möglichen Shortcodes bekannt sind und man nun jede Seite einfach auf der Vorhandensein geprüft werden kann. Das Template oben kann via `partialCached` in eine Variable gespeichert werden, damit ist sicher gestellt, dass der komplette Seiteninhalt nur einmal komplett durchlaufen werden muss. Im nächsten Fragment wird dann der Einsatz im HTML Header Template gezeigt:

```
{{- $includes := unmarshal (partialCached "shortcodes/shortcode-helper-cache.html" .) -}}

{{- if reflect.IsMap $includes -}}
  {{/* Loop through the shortcode cache, check if one is used in the current page and collect the necessary requirements (includes) */}}
  {{- range $shortcodeName, $refs := $includes  -}}
    {{- if $context.HasShortcode $shortcodeName -}}
      {{- if isset $refs "js" -}}
        {{- $js = $js | append (index $refs "js") -}}
      {{- end -}}
      {{- if isset $refs "css" -}}
        {{- $css = $css | append (index $refs "css") -}}
      {{- end -}}
      {{- if isset $refs "scss" -}}
        {{- $scss = $scss | append (index $refs "scss") -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
```

Nachdem die Schleife durchlaufen ist, hat man Variablen, die die jeweils benötigten CSS, SCSS und JavaScript Dateien enthalten...

## Potentielle Verbesserungen

* Die Serialisierung in JSON zur Übergabe zwischen den Templates ist nicht notwendig. Man könnte einfach darauf verzichten
* Die Überprüfung der ob eine Datei wirklich eine Metadatendeninition enthält ist überflüssig, ohne sie könnten diese auch überschrieben werden, z.B. wenn der Shortcode in einem Theme definiert ist.

## Update 15.4.2025

Mit Hugo 0.146.0 hat sich die [Struktur der Templates geändert](https://github.com/gohugoio/hugo/pull/13541), daher musste der Pfad in `define` geändert werden.
