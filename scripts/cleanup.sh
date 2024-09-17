#!/usr/bin/env bash

./themes/projektemacher-base/scripts/cleanup.sh
rm static/images/*.svg
rm static/images/bill*.png
rm static/images/red-lether.jpg
find content/ -name "ogPreview*.*" -exec rm {} \;
find content -name '*-boxed.jpg' -print -exec rm {} \;
