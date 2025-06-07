---
date: 2025-05-05T18:22:44+02:00
title: "Menus in Hugo draft mode"
cite: true
tags:
  - Hugo
---
Sometimes you want to add new menu items without publishing them...
<!--more-->
...e.g. because you create other blog entries while you are working on them. Unfortunately, Hugo does not offer the option of marking menu items as drafts. But you can easily add this yourself:

## Implementation

In the Hugo configuration (`config.toml`, `hugo.toml` or in the file format used), a parameter (e.g. `draft = true`) must be added to the [Menu configuration](https://gohugo.io/configuration/menus/) section:

```toml
[menus]
  [[menus.main]]
    name = 'New unfinished section'
    pageRef = '/work-in-progress'
    [menus.main.params]
      draft = true
```

This must then simply be checked in the [Template that generates the menus](https://gohugo.io/templates/menu/). You also need to check whether [Draft mode](https://gohugo.io/methods/site/builddrafts/) is active. In the example, the menu is assembled in a loop and an entry is simply skipped if both conditions are met.

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

Now the entry only appears if you start in draft mode:
```
hugo -D server
```


## Thanks

Thanks to [***irkode***](https://discourse.gohugo.io/u/irkode/summary) from the Hugo forum who [helped me](https://discourse.gohugo.io/t/draft-menu-entries/54622) with the solution.

## Update 2.6.2025

The new feature is now available: The [search](/post/site-search/).
