#!/usr/bin/env bash

IMAGES=$(find content -maxdepth 6 -name '*.jxl' -and -not -name '*-hdr.jxl') ./themes/projektemacher-base/scripts/iiif.sh
#IMAGES=$(find content -maxdepth 6 -name '*.hdr.jxl') ./scripts/hdr-iiif.sh
