---
date: 2023-11-16T15:22:44+02:00
title: "JSON für Anwendungsbündel komprimieren"
keywords: JSON, Kompression, Anwendungsbündel, Bundle
cite: true
tags:
- JavaScript
- Data
- JSON
wikidata:
  - https://www.wikidata.org/wiki/Q2493
---

Für die Videometadaten von [911 TV](https://911tv.projektemacher.org/) gab es eine interessante Herausforderung zu lösen...
<!--more-->

In der Regel versuche ich, Anwendungen so statisch wie möglich zu konzipieren: Weniger bewegliche Teile / Abhängigkeiten reduzieren die potentiellen Probleme stark.

Dazu zählen auch Nutz- und Metadaten, die sich nicht so häufig ändern. Im Fall von 911TV sind das die Zuordnungen von Sender und Zeitcode zur Videodatei, allerdings kommen bei der Beschreibung von 3.000 Stunden internationale TV-Nachrichten von 20 Sendern aus 7 Tagen[^1] (meist aufgespalten in Blöcken von 30 min) einige Daten an.

Für die Anwendung werden diese Daten aus der Webseite des Internet Archivs extrahiert und zusätzlich die Header der Videos ausgelesen, da das Material viele kleine Lücken hat. Am Ende existiert eine 1.62MB große JSON Datei, die wiederum im nächsten Schritt Teil des Anwendungsbündels wird…

Das ist eine Menge, und jeder Bündler wird einige Warnungen dazu auswerfen. Natürlich kann man noch ein paar Leerzeichen und Zeilenumbrüche entfernen, aber der Unterschied ist nicht sehr groß. Der Versuch [JSON Crush](https://github.com/KilledByAPixel/JSONCrush) zu versuchen schlug fehl: Der Algorithmus skaliert sehr schlecht und war in einer realistischen Zeit nicht in der Lage, das JSON zu komprimieren, dazu scheint er nicht auf mehreren CPUs arbeiten zu können.

Die zweite Idee war ein eher klassisches Kompressionsformat zu verwenden und dann das Ergebnis wiederum in einem JSON Schnipsel zu verpacken, damit man weiterhin mit den klassischen Werkzeugen eines Bundlers arbeiten kann.

## Verfahren


* [`lz-string`](https://github.com/pieroxy/lz-string) ist die JavaScript Variante des LZ Algorithmus Da die Komprimierten Daten Binär vorliegen, müssen sie für die Speicherung als Zeichenkette mittels BASE64 kodiert werden.
* [`brotli-unicode`](https://github.com/kyr0/brotli-unicode) ist eine JavaScript Variante des Brotli Algorithmus mit einer sehr cleveren Ergänzung, es nutzt den kompletten Unicode Zeichensatz um Binärdaten zu kodieren.

## Ergebnisse

| Verfahren        | Größe   |
|------------------|---------|
| Unkomprimiert    | 1.62 MB |
| `lz-string`      | 216 KB  |
| `brotli-unicode` | 87.9 KB |
{.fitted .center .header-underline .content-left}

## Einbindung

### Vorbereitung

Da es einen Vorbereitungsschritt gibt, um die Daten überhaupt zu erheben, können die Daten in diesem Schritt mit erstellt werden. Hier ein einfaches Script zur Ausführung mit [NodeJS](https://nodejs.org/en), die notwendigen Module müssen natürlich installiert sein:

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

Prinzipiell ist es aber auch denkbar, das Ganze als [Vite](https://vite.dev/)- oder [Rollup](https://rollupjs.org/) Plugin zu realisieren...

### In der Anwendung
Das JSON für die Einbindung enthält einen sehr einfachen Header und den komprimierten Inhalt:
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

## Zusammenfassung
JSON Dateien können mittels `unicode-brotli` sehr effizient komprimiert und gebündelt werden. Wichtig ist allerdings zu erwähnen, dass die Daten zur Laufzeit dekomprimiert werden und somit im Arbeitsspeicher den Clients den kompletten Platz belegen. Das ist aber bis zu einer gewissen Größe der Ausgangsdatei im Vergleich zu den anderen Vorteil zu verkraften.

[^1]: [Understanding 9/11 - A Television News Archive](https://archive.org/details/911), Internet Archive.
