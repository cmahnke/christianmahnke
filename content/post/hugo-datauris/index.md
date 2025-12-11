---
date: 2025-12-11T11:22:44+01:00
title: "Ressourcen als Data-URL in Hugo einbetten"
cite: true
tags:
  - Hugo
---

Manchmal ist es einfacher externe Ressourcen in HTML einzubinden...
<!--more-->

Ein Anwendungsfall kann ein zusätzlicher darauf folgender Bearbeitungsschritt sein, bei dem es Probleme mit der Auflösung von relativen URLs gibt. Für solche (und andere) Fälle ist es möglich Ressourcen in HTML als sogenannte [Data-URI bzw. Data-URL](https://de.wikipedia.org/wiki/Data-URL) einzubetten.

Diese haben die folgende Form: `data:image/png;base64,Daten`, beginnen also mit `data:`, gefolgt vom MIME-Typ (hier `image/png`), einem Semikolon (`;`), dem Kodierverfahren (hier `base64`), einem weiten Komma (`,`) und dann den kodierten Daten.

Hier ist ein einfaches Hugo-Template um diese aus Hugo-Ressourcen zu erzeugen:

# Template

Dieses Fragment kann einfach als `layouts/_partials/data-uri.html` bzw. `layouts/partials/data-uri.html` für Hugo-Versionen vor 0.146.0, gespeichert werden.

```go-html-template
{{- $res := . -}}
{{- if eq (printf "%T" $res) "*resources.resourceAdapter" -}}
    data:{{ $res.MediaType }};base64,{{ $res.Content | base64Encode -}}
{{- else -}}
    {{- warnf "[print/data-uri.html] Input need to be a resourceAdapter!" -}}
{{- end -}}
```

# Beispiel

An der Stelle im eigenen Template an der das Bild eingebunden werden soll, muss dann das neue `partial` aufgerufen werden. Als Parameter wird die geladene (Bild-) Ressource.

```go-html-template
{{- $path := "path/to/image" -}}
{{- $src := "" -}}
{{- with or (.Page.Resources.Get $path) (resources.Get $path) -}}
  {{- $src = partial "data-uri.html" . -}}
{{- end -}}
```
