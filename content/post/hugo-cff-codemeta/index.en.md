---
date: 2026-01-13T18:52:22+02:00
title: 'CFF zu CodeMeta in Hugo'
description: "Part 1 on software metadata"
cite: true
tags:
- SoftwareDevelopment
- Metadata
- Hugo
- JSON
wikidata:
  - https://www.wikidata.org/wiki/Q1713
  - https://www.wikidata.org/wiki/Q108218387
  - https://www.wikidata.org/wiki/Q364
  - https://www.wikidata.org/wiki/Q22661177
---

For an upcoming release of software for visualising a collection, I have been looking into [Citation File Format](https://citation-file-format.github.io/).

<!--more-->
CFF ([Citation File Format](https://citation-file-format.github.io/)) is a YAML-based standard that provides citation information for software (and data) in text files. This makes them readable for both humans and machines. This allows users to make suggestions on how code (or data) should be cited correctly. 
The current version (1.2.0) is integrated into platforms such as [GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files) [Zenodo](https://help.zenodo.org/docs/github/describe-software/citation-file/) and allows the export of various styles and formats.
The stated goal is to increase the scientific visibility of software projects.
To facilitate the creation and maintenance of the file, there is also a wizard: [CFFInit](https://citation-file-format.github.io/cff-initializer-javascript/#/). The result is simply saved in the root of the respective Git repository as `CITATION.cff` (like `README.md`, for example).

## Example

This is an example of a `CITATION.cff` file.

```yaml
cff-version: 1.2.0
title: Kartenvisualisierung der Metadaten der Kirchhoff-Sammlung
message: >-
  If you use this software, please cite it using the
  metadata from this file.
type: software
authors:
  - given-names: Chrisitian
    family-names: Mahnke
    orcid: 'https://orcid.org/0009-0003-1361-4159'
    affiliation: Universität Göttingen
    email: mahnke@kustodie.uni-goettingen.de
repository-code: 'https://github.com/cmahnke/hermes-studie-10'
abstract: >-
  Es handelt sich um eine Visualisierung von Metadaten aus
  dem Sammlungsportal der Universität Göttingen für die
  Kirchhoff-Sammlung. Diese werden auf einer Weltkarte und
  als Wortwolke dargestellt.
keywords:
  - Karte
  - Visualisierung
  - Wortwolke
license: CC-BY-NC-4.0
```

## CodeMeta

Since the fundamental goal is to increase visibility through citation, other uses of the data, such as indexing (and thus discovery), are of secondary importance. Another format can help here: [CodeMeta](https://codemeta.github.io/).
One of the goals behind this is that it is based on [Schema.org](https://schema.org/), a standard for marking up structured (meta) data, e.g. for search engines. Software-specific data is bundled in a JSON-LD file.
Another goal is to enable the reusability of existing data. To this end, the standard also serves as a [‘translation table’ (cross-walk)](https://codemeta.github.io/crosswalk/) (more [here](https://github.com/codemeta/codemeta/tree/master/crosswalks)) for translating data from other schemas and formats.

## Implementation in Hugo

In order to use existing `CITATION.cff` files in Hugo, I wrote a simple Hugo template that can be placed in the HTML header (usually in `/layouts/baseof.html`), for example. Another option is to define your own [`OutputFormat`](https://gohugo.io/configuration/output-formats/) to redirect the output to your own JSON-LD file. Alternatively, you can embed it in the respective entry (e.g. `BlogArticle` or `CreativeWork`) as `mentions`.

<!--
In order for the file with `cff` to be read as YAML in Hugo, the media type must be defined in the Hugo configuration (`hugo.toml`, `config.toml`).

```toml
[mediaTypes]
  [mediaTypes."application/yaml"]
    suffixes = ["cff"]
```
-->
```go-template
{{- $cffFile := "CITATION.cff" -}}
{{- with .Resources.Get $cffFile -}}
  {{- $cff := . | transform.Unmarshal (dict "format" "yaml") -}}
  {{- $codemeta := dict -}}
  {{- if $cff -}}
    {{- $authors := slice -}} 
    {{- range $cff.authors -}} 
      {{- $givenName := index . "given-names" -}}
      {{- $familyName := index . "family-names" -}}
      {{- $a := dict "@type" "Person" "givenName" $givenName "familyName" $familyName -}} 
      {{- with index . "orcid" -}}
        {{- $a = merge $a (dict "@id" .) -}}
      {{- end -}} 
      {{- with index . "affiliation" -}}
        {{- $a = merge $a (dict "affiliation" (dict "@type" "Organization" "name" .)) -}}
      {{- end -}} 
      {{- $authors = $authors | append $a -}} 
    {{- end -}} 
    {{- $datePublished := (index $cff "date-released") | default "" -}}
    {{- $codemeta = dict
      "@context" "https://doi.org/10.5063/schema/codemeta-3.0"
      "@type" "SoftwareSourceCode"
      "name" $cff.title
      "softwareVersion" $cff.version
      "description" ($cff.abstract | default "")
      "author" $authors
      "datePublished" $datePublished
      "license" (printf "https://spdx.org/licenses/%s" $cff.license)
      "codeRepository" (index $cff "repository-code" | default "")
      "runtimePlatform" (index $cff "repository" | default "")
    -}} 
    {{- with $cff.keywords -}}
      {{- $codemeta = $codemeta | merge $codemeta (dict "keywords" .) -}}
    {{- end -}} 
    {{- if index $cff "identifiers" -}} 
      {{- $ids := slice -}} 
      {{- range $cff.identifiers -}} 
        {{- $ids = $ids | append (dict "@type" "PropertyValue" "propertyID" .type "value" .value) -}} 
      {{- end -}} 
      {{- $codemeta = merge $codemeta (dict "identifier" $ids) -}} 
    {{- end -}} 
  {{- end -}}
  {{- $codemeta | jsonify -}}
{{- else -}}
  {{- errorf "[metadata/codemeta.json] %s not found at %s" $cffFile .RelPermalink -}}
{{- end -}}
```