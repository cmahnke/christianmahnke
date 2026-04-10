#!/usr/bin/env bash

python get_entities.py https://christianmahnke.de/meta/schema.org/index.json
docker run --rm -v "$(pwd):/data" ghcr.io/cmahnke/lod-tools/rdf2hdt:latest enriched_entities.ttl enriched_entities.hdt