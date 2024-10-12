#!/usr/bin/env bash

cd  public
vips dzsave page031.jpg page031 --tile-size=512 --layout iiif --id http://localhost:5173
cd ..

cd  ./scripts/

python ./update-manifest.py -i ../public/manifest.json -a ../public/page031.json -o ../public/manifest-enriched.json

SED=sed
OS="`uname`"
case "$OS" in
  'Darwin')
    SED=gsed
    ;;
  'Linux')
    SED=sed
    ;;
esac

$SED -i -E 's/https:\/\/christianmahnke.de\/post\/tactile-feedback/http:\/\/localhost:5173/g' ../public/manifest-enriched.json
