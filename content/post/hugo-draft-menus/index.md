---
date: 2025-05-05T18:22:44+02:00
title: "Menüs im Hugo Entwurfsmodus"
cite: true
tags:
  - Hugo
---
Manchmal will man neue Menüpunkte hinzufügen, ohne sie zu veröffentlichen...
<!--more-->
...z.B. weil man während man daran arbeitet, parallel weitere Blog Einträge erstellt. Leider bietet Hugo von sich aus nicht die Möglichkeit Menüeinträge als Enwurf zu kennzeichnen. Aber man kann das leicht selbst hinzufügen:

## Implementierung

In der Hugo Konfiguraton (`config.toml`, `hugo.toml` bzw. in dem eingesetzten Dateiformat) muss der Abschnitt der [Menü Konfiguration](https://gohugo.io/configuration/menus/) ein Parameter (z.B. `draft = true`) eingefügt werden:

```toml
[menus]
  [[menus.main]]
    name = 'New unfinished section'
    pageRef = '/work-in-progress'
    [menus.main.params]
      draft = true
```

Dieser muss dann einfach im [Template, dass die Menüs generiert](https://gohugo.io/templates/menu/) überprüft werden. Dazu muss noch geschaut werden, ob der [Entwurfsmodus](https://gohugo.io/methods/site/builddrafts/) aktiv ist. In dem Beispiel wird das Menü in einer Schleife zusammengesetzt und ein Eintrag einfach übersprungen, wenn beide Bedingungen erfüllt sind.

```go-html-template
{{- with .Site.Menus.main -}}
  {{- range sort . -}}
    {{- if and .Params.draft (not site.BuildDrafts) -}}
      {{- continue -}}
    {{- end -}}
    <a href="{{ .URL }}">{{ .Name }}</a>
  {{- end -}}
{{- end -}}
```

Nun erscheint der Eintrag nur noch wenn man im Entwurfsmodus startet:
```
hugo -D server
```

## Dank

Dank an [***irkode***](https://discourse.gohugo.io/u/irkode/summary) aus dem Hugo Forum, der mich bei der Lösung [unterstützt hat](https://discourse.gohugo.io/t/draft-menu-entries/54622).
