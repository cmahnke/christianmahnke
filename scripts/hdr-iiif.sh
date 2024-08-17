#!/bin/sh

TILE_SIZE=512

if [ -z "$SKIP_IIIF" ] ; then

    if [ -z "$IMAGES" ] ; then
        echo 'No $IMAGES passed - try IMAGES=$(find content -name "*.jpg") ./themes/projektemacher-base/scripts/iiif.sh'
        exit 1
    fi

    if [ -z "$URL_PREFIX" ] ; then
        echo "URL_PREFIX is not set, setting it to '$DEFAULT_URL_PREFIX'"
        URL_PREFIX="$DEFAULT_URL_PREFIX"
    else
        if [ `echo "$URL_PREFIX" | rev| head -c 1` = "/" ] ; then
            URL_PREFIX=`echo $URL_PREFIX |sed 's/.$//'`
            echo "Removed tailing slash: $URL_PREFIX"
        fi
    fi

    for IMAGE in $IMAGES
    do
        IMAGE_SUFFIX=$(echo $IMAGE |awk -F . '{print $NF}')
        OUTPUT_DIR=`dirname $IMAGE`
        IIIF_DIR=`basename $IMAGE .$IMAGE_SUFFIX`
        if [ $OUTPUT_PREFIX = ""] ; then
            TARGET=$OUTPUT_DIR/$IIIF_DIR
        else
            TARGET=$OUTPUT_PREFIX/$OUTPUT_DIR/$IIIF_DIR
            mkdir -p $TARGET
        fi

        echo "Processing $IMAGE"

        python ./scripts/hdr_iiif_static.py -p "$URL_PREFIX" -t "$TILE_SIZE" -d -i $IMAGE -o "$TARGET"
    done

fi
