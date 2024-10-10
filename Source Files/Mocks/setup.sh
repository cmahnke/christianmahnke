#!/usr/bin/env bash

cd  touch/public/
vips dzsave page031.jpg page031 --tile-size=512 --layout iiif --id http://localhost:5173/touch/page031/
