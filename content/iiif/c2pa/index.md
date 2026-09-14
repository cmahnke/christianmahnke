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
this feature. It's required to indicate [C2PA Content Credentials](https://en.wikipedia.org/wiki/Content_Credentials) to a IIIF
viewer.

Image tiles served via the IIIF Image API can carry embedded C2PA manifests
(JUMBF), but a viewer cannot know that without downloading and inspecting
tile bytes. An explicit signal in `info.json` lets viewers badge provenance
support up front and decide whether per-tile validation is worthwhile.
Advertisement is a hint, not proof: only validating the manifest store of
the served bytes establishes provenance.

The experimental IIIF tiler [Fliiifenleger](https://cmahnke.github.io/fliiifenleger/) can be used to create static image pyramids with embedded credentials.

You can add the URL to this page in the `supports` section of the `profile`
definition of your `info.json` (Image API 2):

```json
"profile": [
  "http://iiif.io/api/image/2/level0.json",
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
"@context": [
  "http://iiif.io/api/image/3/context.json",
  {
    "c2pa": "https://christianmahnke.de/iiif/c2pa/",
    "trustAnchor": {
      "@id": "c2pa:trustAnchor",
      "@type": "@id"
    }
  }
],
"profile": "level0",
"extraFeatures": [
  "https://christianmahnke.de/iiif/c2pa/"
],
"c2pa:trustAnchor": "PEM file URL"
```

> This approach is currently not complete, since it lacks a way to provide a custom trust anchor. This will be added for usage with IIIF Image API V3 in the future.

Since this is currently unfinished on the client side, there is currently no official discussion yet.
