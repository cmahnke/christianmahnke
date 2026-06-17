#!/usr/bin/env bash

set -e

#SEARCH_PATH=docs/{en/post,post}
SEARCH_PATH="docs/en/post docs/post"
SEARCH_FILE="index.html"
SEARCH_STRING=gallery-image

find $SEARCH_PATH -type f -name "*.jpg" -size +2M -not -path '*/full/full/*' | while read -r jpg_file; do
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
        echo "Removing $jpg_file sice there should be a WebP replacement"
        rm "$jpg_file"
    fi
done
