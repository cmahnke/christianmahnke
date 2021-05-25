#!/bin/bash

# Generate Previews
TARGETFORMAT=png ./themes/projektemacher-base/scripts/preview.sh

# Favicons
SOURCE="themes/projektemacher-base/static/images/cm.svg" OPTIONS="-transparent white static/images/favicon-128.png" ./themes/projektemacher-base/scripts/favicon.sh

yarn install
yarn run svgo
