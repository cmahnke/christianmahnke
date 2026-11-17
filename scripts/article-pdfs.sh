#!/usr/bin/env bash

SEARCH_DIR="docs"
SCRIPT_LOCATION=`dirname "$(realpath $0)"`

VIVLIOSTYLE="/Users/cmahnke/Blogs/vivliostyle-batch-cli/dist/vivliostyle-batch-cli.js"
VIVLIOSTYLE_NODE_PATH="/Users/cmahnke/Blogs/vivliostyle-batch-cli/node_modules"

ARGS="$@"

hugo --renderSegments print

if [ ! -d "$SEARCH_DIR" ]; then
    echo "Error: The directory '$SEARCH_DIR' was not found."
    exit 1
fi

echo "Searching for 'article.html' in '$SEARCH_DIR'..."


find $SEARCH_DIR -type f -name "article.html" | while read -r html_file; do
    pdf_file="${html_file%.html}.pdf"

    if [ -f "$pdf_file" ]; then
        echo "Skipping '$pdf_file' (already exists)"
        continue
    fi

    echo "Converting '$html_file' zu '$pdf_file'..."

    #NODE_PATH="$VIVLIOSTYLE_NODE_PATH" node "$VIVLIOSTYLE" -i "$html_file" --asset-base https://christianmahnke.de/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js -o "$pdf_file"

    node node_modules/@projektemacher/vivliostyle-batch-cli/dist/vivliostyle-batch-cli.js -i "$html_file" --static /:./docs/ --asset-base https://christianmahnke.de/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js -o "$pdf_file" $@
    if [ $? -eq 0 ]; then
        echo "'$pdf_file' created successfully"
    else
        echo "Error converting '$html_file'"
    fi
done

echo "Finished"
