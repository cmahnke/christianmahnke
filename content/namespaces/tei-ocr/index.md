---
title: "Namespace: TEI OCR"
date: 2026-09-08
description: "Namespace for attributes added by OCR/HTR tooling to TEI documents, currently ocr:conf for exact recognition confidence."
---

This namespace identifies attributes and elements that are added to
[TEI P5](https://tei-c.org/release/doc/tei-p5-doc/en/html/index.html) documents by
automatic OCR / HTR (handwritten text recognition) tooling, in cases where the TEI
Guidelines provide no slot for the information in question.

The namespace URI is:

```
http://christianmahnke.de/namespaces/tei-ocr/
```

The trailing slash is part of the identifier: namespace URIs are opaque
identifiers, and this exact form (matching the canonical URL of this page) is the
one to use in documents. It is an identifier only — nothing needs to be fetched
from it for documents using it to be valid; this page exists so that humans who
encounter the namespace can find out what it means. Recommended prefix: `ocr`.

## Why it exists

The TEI Guidelines offer `@cert` (values `high`, `medium`, `low`, `unknown`) to
express the confidence in a transcription, but as of TEI P5 there is no
standard-compliant way to attach an exact numeric probability to an individual
token such as a word produced by an OCR/HTR engine (the former
`<certainty>/@confidence` and numeric `<precision>/@precision` are no longer
available in current P5 schemas).

For OCR pipelines that emit per-word probabilities (docTR, Transkribus, etc.),
this loss of precision is unfortunate, so the exact value is carried alongside
the categorical `@cert` in this namespace.

## Definitions

### `ocr:conf` attribute

| | |
|---|---|
| Applies to | any element transcribing an OCR/HTR token, typically `tei:zone` (word zones in `tei:facsimile`/`tei:sourceDoc`) and `tei:w` (word tokens in `tei:body`) |
| Value | decimal in the closed interval 0 to 1, four fractional digits recommended (e.g. `0.9821`) |
| Meaning | the recognition confidence of the OCR/HTR engine for this token; 1 means fully confident, smaller values indicate uncertainty |
| Combines with | `@cert` (categorical confidence), `@resp` (responsible agent) |

An engine that cannot supply a confidence simply omits the attribute; absence of
`ocr:conf` must not be read as confidence 1.

## Example

```xml
<TEI xmlns="http://www.tei-c.org/ns/1.0"
     xmlns:ocr="http://christianmahnke.de/namespaces/tei-ocr/">
  <!-- ... -->
  <facsimile>
    <surface ulx="0" uly="0" lrx="3199" lry="4776" xml:id="surf-page001">
      <graphic url="images/page001.jpg" width="3199px" height="4776px"/>
      <zone type="word" xml:id="p001-w001" points="667,1194 914,1194 914,1283 667,1283"
            cert="high" ocr:conf="0.9987" resp="#doctr">Name</zone>
    </surface>
  </facsimile>
  <text>
    <body>
      <div type="page" facs="#surf-page001">
        <p><w facs="#p001-w001" cert="high" ocr:conf="0.9987">Name</w></p>
      </div>
    </body>
  </text>
</TEI>
```

Documents using this namespace should document it in their
`tei:encodingDesc/tei:tagsDecl` with a `tei:namespace` element.

## Status

Introduced 2026-09-08 for the Kundenbuch OCR pipeline (docTR + Label Studio).
Currently one attribute (`ocr:conf`); further OCR-related extensions will be
added here if needed.

Contact: [Christian Mahnke](mailto:mail@christianmahnke.de)
