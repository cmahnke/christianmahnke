#!/usr/bin/env bash

echo "Set SKIP_IIIF to something to disable generation of IIIF derivates"
./scripts/iiif.sh

# Convert Images
convert Source\ Files/Images/Textures/Red\ Lether.psd -resize 1000x -quality 20 static/images/red-lether.jpg
convert Source\ Files/Images/Bill-Nye.psd[1] -resize 400x static/images/bill-nye.png
convert Source\ Files/Images/Bills-Finger.psd[0] -resize 110x static/images/bills-finger.png

echo "Generated images:"
ls -l static/images

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

yarn install --ignore-engines #--ignore-platform
npm install --force --cpu=arm64 --os=darwin sharp
npm install --force --cpu=x64 --os=linux --libc=glibc sharp
npm install --force --cpu=x64 --os=linux --libc=musl sharp
yarn run svgo
./themes/projektemacher-base/scripts/json-lint.sh
./themes/projektemacher-base/scripts/3d-models.sh
