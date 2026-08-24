#!/usr/bin/env bash

set -e

#SEARCH_PATH=docs/{en/post,post}
SEARCH_PATH="docs/en/post docs/post"
SEARCH_FILE="index.html"
SEARCH_STRING=gallery-image

find $SEARCH_PATH -type f -name "*.jp*g" -size +1M -not -path '*/full/full/*' -and -not -path '*.hdr.*' | while read -r jpg_file; do
    dir=$(dirname "$jpg_file")
    found=0
    check_dir="$dir"
    while [ "$check_dir" != "." ] && [ "$check_dir" != "/" ]; do
        if [ -f "$check_dir/$SEARCH_FILE" ] && grep -q "$SEARCH_STRING" "$check_dir/$SEARCH_FILE"; then
            found=1
            break
        fi
        check_dir=$(dirname "$check_dir")
    done
    if [ "$check_dir" = "." ] && [ -f "$check_dir/$SEARCH_FILE" ] && grep -q '{{< gallery >}}' "$check_dir/$SEARCH_FILE"; then
        found=1
    fi
    if [ "$found" -eq 1 ]; then
        echo "Removing $jpg_file since there should be a WebP replacement"
        rm "$jpg_file"
    fi
done

# TODO enable this - make sure it won't kill hdr stuff
#find $SEARCH_PATH -type f -path '*/full/full/0/default.jpg' -not -path '*-hdr*' -exec mogrify -quality 90 {} \;

find $SEARCH_PATH -type f -path '*.jxl' -not -path '*hdr*' -exec rm {} \;
