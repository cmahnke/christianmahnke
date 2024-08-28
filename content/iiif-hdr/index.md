---
title: "IIIF HDR"
metaPage: true
displayinlist: false
archive: false
news: false
class: hdr-iiif
---

This is currently a placeholder until there is canonical URI to identify this feature. It's required to indicate HDR Content to a IIIF viewer.

For a simple demonstration of a HDR image resource see [this blog post](/en/post/hdr-iiif/).

You can add the URL to this page in the `supports` section of the `profile` definition of your `info.json`:

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
      "https://christianmahnke.de/iiif-hdr/"
    ]
  }
]
```

You can join the discussion on HDR for IIIF on [GitHub](https://github.com/IIIF/api/issues/2312).
