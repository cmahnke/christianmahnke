#!/bin/sh

./themes/projektemacher-base/scripts/cleanup.sh
rm static/images/*.svg
find content -name '*-boxed.jpg' -print -exec rm {} \;
