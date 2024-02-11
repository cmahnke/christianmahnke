#!/usr/bin/env bash

./themes/projektemacher-base/scripts/cleanup.sh
rm static/images/*.svg
rm static/images/bill*.png
find content -name '*-boxed.jpg' -print -exec rm {} \;
