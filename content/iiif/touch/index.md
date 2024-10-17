---
title: "IIIF touch"
metaPage: true
displayinlist: false
archive: false
news: false
class: hdr-iiif
---

# IIIF Touch Extension

This page contains the unofficial IIIF Touch Extension Version 0.1

## Status

This extension is just a proof of concept and will certainly never be a officially recognized extension. The author has no interest to push this forward. A JSON-LD Schema is a [available](./context.json). See ["4.6. Linked Data Context and Extensions
"](https://iiif.io/api/presentation/3.0/#46-linked-data-context-and-extensions) of the specification.

## Demo

See the [blog post](https://christianmahnke.de/post/haptic-feedback/) for further information and a demo.

## Terms

### `sensing`
Touch Annotations use `sensing` as the value for their motivation. The [`motivation`](https://www.w3.org/TR/annotation-model/#motivation-and-purpose) property is part of the Web Annotation specification.


### `haptics`
The transformation property may appear in the body of a Touch Annotation an acts as a container for haptic metadata. Its value is a JSON object with property `vibrate`


### `vibrate`

A property that appears within a `haptics` object to indicate whether to vibrate or not.
