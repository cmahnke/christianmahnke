---
title: "IIIF C2PA"
metaPage: true
displayinlist: false
archive: false
news: false
class: hdr-iiif
---

# IIIF C2PA

This is currently a placeholder until there is a canonical URI to identify
this feature. It's required to indicate C2PA Content Credentials to a IIIF
viewer.

Image tiles served via the IIIF Image API can carry embedded C2PA manifests
(JUMBF), but a viewer cannot know that without downloading and inspecting
tile bytes. An explicit signal in `info.json` lets viewers badge provenance
support up front and decide whether per-tile validation is worthwhile.
Advertisement is a hint, not proof: only validating the manifest store of
the served bytes establishes provenance.

You can add the URL to this page in the `supports` section of the `profile`
definition of your `info.json` (Image API 2):

```json
"profile": [
  "http://iiif.io/api/image/2/level1.json",
  {
    "formats": [
      "jpg"
    ],
    "qualities": [
      "default"
    ],
    "supports": [
      "https://christianmahnke.de/iiif/c2pa/"
    ]
  }
]
```

For Image API 3, the equivalent signal is an entry in `extraFeatures`:

```json
"profile": "level1",
"extraFeatures": [
  "https://christianmahnke.de/iiif/c2pa/"
]
```
