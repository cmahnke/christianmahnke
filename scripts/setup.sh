#!/usr/bin/env bash

set -e

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
SOURCE="themes/projektemacher-base/static/images/cm.svg" OPTIONS="-transparent white" ./themes/projektemacher-base/scripts/favicon.sh

cp themes/projektemacher-base/static/images/cm.svg static/images/
sed -i -E 's/fill-opacity:0.5/fill-opacity:1.0/g' static/images/cm.svg
convert -density 2400 static/images/cm.svg -resize '1024x1024!' static/images/logo.png

# Additional NPM dependencies - npm is a crappy piece of software, can't decouple install from cleanup
#yarn install --ignore-engines #--ignore-platform
#npm install --no-package-lock --no-save --force --cpu=arm64 --os=darwin sharp
#npm install --no-package-lock --no-save --force --cpu=x64 --os=linux --libc=glibc sharp
#npm install --no-package-lock --no-save --force --cpu=x64 --os=linux --libc=musl sharp

find content/iiif/ -name index.md -exec cp -n {} $(dirname {})/index.en.md \;
find content/@cmahnke/ -name index.md -exec cp -n {} $(dirname {})/index.en.md \;

yarn run svgo
./themes/projektemacher-base/scripts/json-lint.sh
./themes/projektemacher-base/scripts/3d-models.sh

./scripts/bibtex.sh

hugo --renderSegments manifests
./scripts/height-map.sh

cp assets/scss/lucienne/lucienne-0.1.0.css themes/projektemacher-base/assets/scss/lucienne/

echo "Make sure './scripts/post-build/index.sh' is executed"
if [ -d ./scripts/post-build ] ; then
    echo "Don't forget to run post build scripts after 'hugo'!"
fi
