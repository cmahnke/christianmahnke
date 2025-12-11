---
date: 2025-12-11T11:22:44+01:00
title: "Embed resources as data URLs in Hugo"
cite: true
tags:
  - Hugo
---

Sometimes it is easier to embed external resources in HTML...
<!--more-->

One use case could be an additional subsequent processing step where there are problems with the resolution of relative URLs. For such (and other) cases, it is possible to embed resources in HTML as so-called [data URIs or data URLs](https://en.wikipedia.org/wiki/Data_URI_scheme).

These have the following form: `data:image/png;base64,data`, i.e., they begin with `data:`, followed by the MIME type (here `image/png`), a semicolon (`;`), the encoding method (here `base64`), a comma (`,`) and then the encoded data.

Here is a simple Hugo template to generate these from Hugo resources:

# Template

This fragment can simply be saved as `layouts/_partials/data-uri.html` or `layouts/partials/data-uri.html` for Hugo versions prior to 0.146.0.

```go-html-template
{{- $res := . -}}
{{- if eq (printf "%T" $res) "*resources.resourceAdapter" -}}
    data:{{ $res.MediaType }};base64,{{ $res.Content | base64Encode -}}
{{- else -}}
    {{- warnf "[print/data-uri.html] Input need to be a resourceAdapter!" -}}
{{- end -}}
```

# Example

The new `partial` must then be called at the point in your own template where the image is to be integrated. The loaded (image) resource is used as a parameter.

```go-html-template
{{- $path := "path/to/image" -}}
{{- $src := "" -}}
{{- with or (.Page.Resources.Get $path) (resources.Get $path) -}}
  {{- $src = partial "data-uri.html" . -}}
{{- end -}}
```
