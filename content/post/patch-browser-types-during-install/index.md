---
date: 2025-08-08T18:33:44+02:00
title: "TypeScript DOM Typen patchen"
keywords: DOM, TypeScript
params:
  cite: true
  wikidata:
    - https://www.wikidata.org/wiki/Q978185
    - https://www.wikidata.org/wiki/Q615940
    - https://www.wikidata.org/wiki/Q2005
    - https://www.wikidata.org/wiki/Q978185
    - https://www.wikidata.org/wiki/Q2093
    - https://www.wikidata.org/wiki/Q6368
tags:
  - JavaScript
  - SoftwareDevelopment
draft: true
---

Das Browser entickeln sich ständig weiter...
<!--more-->

https://github.com/ds300/patch-package




# `package.json`

```json
"ts-prepare-generate": "patch-package && node scripts/git-submodules.js -v -f -d node_modules/@typescript/dom-lib-generator/",
"ts-generate": "cd node_modules/@typescript/dom-lib-generator && npm i && npm run generate",
"ts-post-generate": "rimraf node_modules/@typescript/dom-lib-generator/generated/ts5.*",
"update-types": "npm run ts-prepare-generate && npm run ts-generate && npm run ts-post-generate",
```


# Fazit

Inzwischen sind aber die
