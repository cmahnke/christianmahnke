#!/bin/bash

# Generate Previews
TARGETFORMAT=png ./themes/projektemacher-base/scripts/preview.sh

# Favicons
SOURCE="Source Files/Favicon/Favicon.psd[1]" OPTIONS="-background 'rgba(255, 255, 255, .0)' -resize 300x300 -gravity center -extent 300x300 " ./themes/projektemacher-base/scripts/favicon.sh

yarn install
yarn run svgo
