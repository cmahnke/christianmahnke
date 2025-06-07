---
date: 2024-01-30T18:22:44+02:00
title: "Metadaten für Hugo Shortcodes"
cite: true
tags:
  - Hugo
---

For my blogs I use a Hugo theme as a kind of function library...
<!--more-->

... which of course also includes some shortcodes. And if these require JavaScript functionality, for example, it used to be the case that this was simply integrated into a large bundle. Regardless of whether the shortcode needed it on a page, it was always delivered...

Not a very scalable solution, especially if the shortcode is never used. The normal way to solve this problem in Hugo is a flag that the shortcode sets and that is then evaluated when the HTML header is generated. Here is a similar example from the [documentation](https://gohugo.io/content-management/diagrams/):

As part of the shortcode (Instead of [`.Page.Store`](https://gohugo.io/methods/page/store/) you sometimes see the older [`.Scratch`](https://gohugo.io/methods/page/scratch/)):

```go-html-template
{{ .Page.Store.Set "hasMermaid" true }}
```

As part of the template that creates the HTML header:
```go-html-template
{{ if .Store.Get "hasMermaid" }}
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>
{{ end }}
```

But especially for a function library (or in general) this is not a good / elegant solution, as the shortcodes and the header template are hard linked to each other. Therefore, new shortcodes always require adjustments to the templates. Wouldn't it be nicer if the information about the required scripts and stylesheets could be stored directly with the shortcode?

## Extend shortcodes

Since shortcodes are simply templates, you can do pretty much anything in them, e.g. define further templates, here the file `/layouts/shortcodes/toc.html`:

```go-html-template
<div class="toc">
  <div class="toc-header">{{ i18n "toc" }}</div>
  {{- .Page.TableOfContents -}}
</div>

{{- define "_partials/shortcodes/toc-metadata.html" -}}
  {{- (dict "css" slice "js" slice "scss" (slice "scss/toc.scss")) | jsonify -}}
{{- end -}}
```

The important part here is the definition of an additional template (`define`), this follows a naming convention so that it can be found again:
* The template is stored in the virtual directory `_partials/shortcodes/`
* The name is that of the shortcode / template (`toc`), followed by `-metadata.html`.

The shortcode defines a simple data structure in the form (as YAML):

```yaml
css:
  -
js:
  -
scss:
  -
```

This structure is serialised as JSON so that it can simply be passed as a string, the latter is probably optional.

## Evaluate shortcode metadata

But the above is only half the story, somehow the data must also be available when generating the HTML header or the respective files (CSS and JavaScript).

Since you can only check whether a shortcode is used on a page, you first need a list of all the shortcodes used, which you can then use as a cache so that you don't have to look at the required pages and templates as often later on:

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

The resulting data structure now has the advantage that all possible shortcodes are known and the presence of each page can be easily checked. The template above can be stored in a variable via `partialCached`, which ensures that the complete page content only has to be run through once. The next fragment shows the use of the HTML header template:

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

After the loop has run through, you have variables that contain the required CSS, SCSS and JavaScript files...

## Potential improvements

* Serialisation in JSON for transfer between the templates is not necessary. You could simply do without it
* The check of whether a file really contains a metadata definition is superfluous, without it these could also be overwritten, e.g. if the shortcode is defined in a theme.

## Update 15.4.2025

With Hugo 0.146.0 the [structure of the templates has changed](https://github.com/gohugoio/hugo/pull/13541), therefore the path had to be changed to `define`.
