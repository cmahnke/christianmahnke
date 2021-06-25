#!/usr/bin/env bash

convert Source\ Files/Images/Textures/Red\ Lether.psd -resize 1000x -quality 20 static/images/red-lether.jpg

find content/about/videos -name '*.jpg' -print -exec bash -c 'convert "{}" -resize 1152x -gravity center -background black -quality 95 -extent 1152x864 $(dirname "{}")/$(basename "{}" .jpg)-boxed.jpg' \;

echo "Calling theme scripts"
for SCRIPT in $PWD/themes/projektemacher-base/scripts/init/*.sh ; do
    echo "Running $SCRIPT"
    bash "$SCRIPT"
done

# Generate Previews
TARGETFORMAT=png ./themes/projektemacher-base/scripts/preview.sh

# Favicons
SOURCE="themes/projektemacher-base/static/images/cm.svg" OPTIONS="-transparent white static/images/favicon-128.png" ./themes/projektemacher-base/scripts/favicon.sh

yarn install
yarn run svgo
