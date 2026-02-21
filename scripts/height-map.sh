#!/usr/bin/env bash

IMAGE_PREFIX=content/post
HEIGHTMAP_SCRIPT=`dirname $0`/./height-map.py
MANIFEST_SCRIPT=`dirname $0`/./update-manifest.py
DOCS_DIR=$(grep publishDir config.toml | tr -d '" '  | cut -d "=" -f2 )

SED=sed
OS="`uname`"
case "$OS" in
  'Darwin')
    SED=gsed
    ;;
  'Linux')
    SED=sed
    ;;
esac

for META in `ls -1 $IMAGE_PREFIX/**/*-map.json`
do
    DIR=`dirname $META`
    IMAGE=`basename $META -map.json`
    python3 $HEIGHTMAP_SCRIPT -r 600 --image $DIR/$IMAGE.jxl --metadata $META --output json png --debug -j
    OUT_DIR=`echo $DIR |sed -e "s/content/$DOCS_DIR/"`
    BASE=`echo "$META" |sed -E 's/.*\\/(.*)-map.json/\1/g'`.json
    echo "Updating manifest for $BASE"
    python $MANIFEST_SCRIPT -i $OUT_DIR/manifest.json -a "$DIR/$BASE" -o $DIR/manifest-enriched.json


done
