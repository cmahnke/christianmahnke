---
date: 2026-01-13T18:52:22+02:00
title: 'CFF zu CodeMeta in Hugo'
description: ""
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

Für eine anstehende Veröffenlichung einer Software zur Voisualisierung einer Sammlung habe ich mich etwas mit [Citation File Format](https://citation-file-format.github.io/) beschäftigt.

<!--more-->
CFF ([Citation File Format](https://citation-file-format.github.io/)) ist ein auf YAML basierender Standard, der Zitationsinformationen für Software (und Daten) in Textdateien bereitstellt. Dadurch sind sie sowohl für Menschen als auch für Maschinen lesbar. Dies ermöglicht es Nutzern, Vorschläge zu unterbreiten, wie Code (bzw. Daten) korrekt zitiert werden sollten. 
Die aktuelle Version (1.2.0) ist in Plattformen wie [GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files), [Zenodo](https://help.zenodo.org/docs/github/describe-software/citation-file/) integriert und erlaubt dort den Export verschiedene Stile und Formate.
Das erklärte Ziel ist es, die wissenschaftliche Sichtbarkeit von Softwareprojekten zu steigern.
Zur Erleichterung der Erstellung und Pflege der Datei gibt es auch einen Assistenten: [CFFInit](https://citation-file-format.github.io/cff-initializer-javascript/#/), das Ergebnis wird einfach in der Wurzel des jeweiligen Git-Repositories als `CITATION.cff` gespeichert (wie z.B. `README.md`).

## Beispiel

Dies ist ein Beipsiel für eine `CITATION.cff`-Datei.

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

Da das grundlegende Ziel die Erhöhung der Sichtbarkeit durch Zitierung ist, sind andere Verwendungszwecke der Daten, wie die Indexierung (und damit das Auffinden), eher nachrangig. Hier kann ein anderes Format Abhilfe schaffen: [CodeMeta](https://codemeta.github.io/).
Denn eines der Ziele dahinter ist, dass es auf [Schema.org](https://schema.org/) basiert, einem Standard zur Auszeichnung strukturierter (Meta-)Daten, z. B. für Suchmaschinen. Softwarespezifische Daten werden dabei in einer JSON-LD-Datei gebündelt.
Ein weiteres Ziel ist es, die Wiederverwendbarkeit bestehender Daten zu ermöglichen. Dazu dient der Standard auch als ["Übersetzungstabelle" (Cross-Walk)](https://codemeta.github.io/crosswalk/) (mehr [hier](https://github.com/codemeta/codemeta/tree/master/crosswalks)), um Daten aus anderen Schemata und Formaten zu übersetzen.

## Realisierung in Hugo

Um bestehende `CITATION.cff`-Dateien in Hugo nutzen zu können, habe ich ein einfaches Hugo-Template geschrieben, das z. B. in den HTML-Header (meist in `/layouts/baseof.html`) werden kann. Eine andere Möglichkeit ist ein eigenes [`OutputFormat`](https://gohugo.io/configuration/output-formats/) zu definieren, um die Ausgabe in einer eigenen JSON-LD-Datei umzuleiten. Oder man bindet es in den jeweiligen Eintrag (z.B. `BlogArticle` oder `CreativeWork`) als `mentions` ein.

<!--
Damit die Datei mit `cff` in Hugo als YAML gelsen werden kann, muss noch der Medientyp in der Hugo Konfigurieration (`hugo.toml`, `config.toml`) definiert werden.

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
