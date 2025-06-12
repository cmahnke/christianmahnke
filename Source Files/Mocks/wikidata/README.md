# Wikidata demonstrator

# Getting required URIs

```
curl  "https://christianmahnke.de/meta/wikidata/index.json" | jq '[.pages[].wikidata] | flatten | unique'
```
