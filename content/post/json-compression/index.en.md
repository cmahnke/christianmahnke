---
date: 2023-11-16T15:22:44+02:00
title: "Compress JSON for application bundles"
keywords: JSON, Compression, application bundles
cite: true
tags:
- JavaScript
- Data
- JSON
---

For the video metadata of [911 TV](https://911tv.projektemacher.org/) there was an interesting challenge to solve...
<!--more-->

As a rule, I try to design applications to be as static as possible: Fewer moving parts / dependencies greatly reduce potential problems.

This also includes payload and metadata that doesn't change that often. In the case of 911TV, this is the assignment of the channel and time code to the video file, but when describing 3,000 hours of international TV news from 20 channels over 7 days[^1] (usually split into blocks of 30 minutes), some data is generated.

For the application, this data is extracted from the website of the Internet Archive and the headers of the videos are also read out, as the material has many small gaps. At the end there is a 1.62MB JSON file, which in turn becomes part of the application bundle in the next step...

That's a lot, and every bundler will throw up a few warnings. Of course, you can remove a few more spaces and line breaks, but the difference is not very big. The attempt to try [JSON Crush](https://github.com/KilledByAPixel/JSONCrush) failed: The algorithm scales very poorly and was not able to compress the JSON in a realistic time, plus it doesn't seem to be able to work on multiple CPUs.

The second idea was to use a more classic compression format and then package the result in a JSON snippet so that you can continue to work with the classic tools of a bundler.

## Methods

* [`lz-string`](https://github.com/pieroxy/lz-string) is the JavaScript variant of the LZ algorithm Since the compressed data is binary, it must be encoded using BASE64 for storage as a character string.
* [`brotli-unicode`](https://github.com/kyr0/brotli-unicode) is a JavaScript variant of the Brotli algorithm with a very clever addition, it uses the complete Unicode character set to encode binary data.

## Results

| Method           | Größe   |
|------------------|---------|
| Uncompressed     | 1.62 MB |
| `lz-string`      | 216 KB  |
| `brotli-unicode` | 87.9 KB |
{.fitted .center .header-underline .content-left}

## Integration

### Preparation

As there is a preparatory step to collect the data in the first place, the data can also be created in this step. Here is a simple script for execution with [NodeJS](https://nodejs.org/en), the necessary modules must of course be installed:

```javascript
import fs from 'fs';
// Needed to import legacy code
import { createRequire } from "module";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);

const LZString = await import(require.resolve("../site/node_modules/lz-string"));
const lzCompress = LZString.default.compressToBase64;

const Brotli = await import(require.resolve("../site/node_modules/brotli-unicode"));
const brotliCompress = Brotli.default.compress;


const defaultMethod = "lz-string";

const {
  values: { input, output, type },
} = parseArgs({
  options: {
    input: {
      type: "string",
      short: "i",
    },
    output: {
      type: "string",
      short: "o",
    },
    type: {
      type: "string",
      short: "t",
    },
  },
});

let method = type;
if (type === undefined) {
  method = defaultMethod;
}

if (input !== undefined) {
  console.error(`Reading file ${input}`);
  const fileContents = fs.readFileSync(input).toString()
  let compressed
  if (method == "jsoncrush") {
    console.error(`Crushing JSON`);
    compressed = crush(fileContents);
  } else if (method == "lz-string") {
    console.error(`Compressing JSON`);
    compressed = lzCompress(fileContents);
  } else if (method == "brotli") {
    console.error(`Compressing JSON`);
    compressed = await brotliCompress(Buffer.from(fileContents));
  } else {
    console.error(`unknown compression type ${method}`);
    process.exit(1);
  }
  const out = {'type': method, 'content': compressed}
  if (output !== undefined) {
    console.error(`Writing file ${output}`);
    fs.writeFileSync(output, JSON.stringify(out));
  } else {
    console.log(out)
  }
}
```

In principle, however, it is also conceivable to realise the whole thing as a [Vite](https://vite.dev/) or [Rollup](https://rollupjs.org/) plugin...

### In the application
The JSON for the integration contains a very simple header and the compressed content:
```json
{"type":"brotli","content":"[COMPRESSED DATA]"}
```


In der Anwendungsdatei, die das JSON dann braucht:
```javascript
import {decompress} from "brotli-unicode/js";
import { decompressFromBase64 } from "lz-string";
import jsonImport from "./assets/json/json-compressed.json";

function parseJson(json) {
  if (typeof json == "object" && Object.keys(json).length == 2) {
    if ("type" in json && json.type === "lz-string") {
      return JSON.parse(decompressFromBase64(json["content"]));
    } else if ("type" in json && json.type === "brotli") {
      console.log("'brotli' isn't supported yet!");
      return import("brotli-unicode/js").then((Brotli) => {
        const decompressed = Brotli.decompress(json["content"]);
        return JSON.parse(TextDecoder.decode(decompressed));
      });
    }
  }
  return json;
}

//
let json = parseJson(jsonImport);
```

## Summary
JSON files can be compressed and bundled very efficiently using `unicode-brotli`. However, it is important to note that the data is decompressed at runtime and therefore takes up all the space in the client's working memory. However, this is tolerable up to a certain size of the output file compared to the other advantages.

[^1]: [Understanding 9/11 - A Television News Archive](https://archive.org/details/911), Internet Archive.
