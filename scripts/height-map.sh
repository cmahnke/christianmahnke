#!/usr/bin/env bash

IMAGE_PREFIX=content/post
SCRIPT=`dirname $0`/./height-map.py

for META in `ls -1 $IMAGE_PREFIX/**/*-map.json`
do
    DIR=`dirname $META`
    IMAGE=`basename $META -map.json`
    python3 $SCRIPT --image $DIR/$IMAGE.jpg --metadata $META --output json png --debug

done
