#!/usr/bin/env bash

cd  ./scripts/

python ./update-manifest.py -i ../public/manifest.json -a ../public/page031-1.json -o ../public/manifest-enriched.json
