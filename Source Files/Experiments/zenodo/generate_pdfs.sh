#!/usr/bin/env bash

SCRIPT_LOCATION=`dirname "$(realpath $0)"`

VIVLIOSTYLE="$SCRIPT_LOCATION/../vivliostyle-batch-cli/src/vivliostyle-batch.ts"
VIVLIOSTYLE_NODE_PATH="$(dirname $VIVLIOSTYLE)/../node_modules"

ROOT="$SCRIPT_LOCATION/../../../"
echo "Base dir is $ROOT $VIVLIOSTYLE_NODE_PATH"
cd "$ROOT" && hugo --renderSegments print



find docs/post/ -name article.html | while read -r FILE_PATH; do
    # FILE_PATH: The initial file path (e.g., docs/post/my-post/article.html)
    # BASE_PATH_NAME: The path and base name without the extension (e.g., docs/post/my-post/article)
    BASE_PATH_NAME="${FILE_PATH%.*}"
    #ls 
    NODE_PATH="$VIVLIOSTYLE_NODE_PATH" node "$VIVLIOSTYLE" -i "$FILE_PATH" --html --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js -o "${BASE_PATH_NAME}.pdf"
done

#Source Files/Experiments/vivliostyle-batch-cli/src/vivliostyle-batch.ts