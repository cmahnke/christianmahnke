# Wikidata demonstrator

# Getting required URIs

```
curl  "https://christianmahnke.de/meta/wikidata/index.json" | jq '[.pages[].wikidata] | flatten | unique'
```


# Rust approach

It could have been easy

https://crates.io/crates/hdt
https://github.com/kampersanda/sucds/issues/98
