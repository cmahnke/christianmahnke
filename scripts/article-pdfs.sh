#!/usr/bin/env bash

SEARCH_DIR="docs"
SCRIPT_LOCATION=`dirname "$(realpath $0)"`

VIVLIOSTYLE="/Users/cmahnke/Blogs/vivliostyle-batch-cli/dist/vivliostyle-batch-cli.js"
VIVLIOSTYLE_NODE_PATH="/Users/cmahnke/Blogs/vivliostyle-batch-cli/node_modules"

ARGS="$@"

# Optional first positional argument: regenerate only the matching post
# (matched against the URL path segment, e.g. ./scripts/article-pdfs.sh whalebone-arch-levin-park)
SINGLE_POST=""
if [ -n "$1" ] && [[ "$1" != -* ]]; then
    SINGLE_POST="$1"
    shift
fi

# Standards labeling of every PDF (PDF/A-2b by default, PDFA_LEVEL=off to skip,
# VERAPDF=1 to additionally run the full ISO rule set through the verapdf binary)
PDF_ARGS=()
if [ "${PDFA_LEVEL:-2b}" != "off" ]; then
    PDF_ARGS+=(--pdfa "${PDFA_LEVEL:-2b}")
fi
if [ "${VERAPDF:-0}" = "1" ]; then
    PDF_ARGS+=(--verapdf)
fi

hugo --renderSegments print

if [ ! -d "$SEARCH_DIR" ]; then
    echo "Error: The directory '$SEARCH_DIR' was not found."
    exit 1
fi

echo "Searching for 'article.html' in '$SEARCH_DIR'..."

if [ -n "$SINGLE_POST" ]; then
    echo "Single-post mode: regenerating only '$SINGLE_POST'"
    find $SEARCH_DIR -path "*/$SINGLE_POST/*" -name "article.pdf" -delete
fi

find $SEARCH_DIR -type f -name "article.html" | while read -r html_file; do
    pdf_file="${html_file%.html}.pdf"

    if [ -n "$SINGLE_POST" ] && [[ "$html_file" != *"/$SINGLE_POST/"* ]]; then
        continue
    fi

    if [ -f "$pdf_file" ]; then
        echo "Skipping '$pdf_file' (already exists)"
        continue
    fi

    if grep -q 'http-equiv="refresh"' "$html_file"; then
        echo "Skipping '$html_file' (alias redirect page)"
        continue
    fi

    echo "Converting '$html_file' zu '$pdf_file'..."

    #NODE_PATH="$VIVLIOSTYLE_NODE_PATH" node "$VIVLIOSTYLE" -i "$html_file" --asset-base https://christianmahnke.de/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js -o "$pdf_file"

    node node_modules/@projektemacher/vivliostyle-batch-cli/dist/vivliostyle-batch-cli.js -i "$html_file" --static /:./docs/ --asset-base https://christianmahnke.de/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js "${PDF_ARGS[@]}" -o "$pdf_file" $@
    if [ $? -eq 0 ]; then
        echo "'$pdf_file' created successfully"
    else
        echo "Error converting '$html_file'"
    fi
done

echo "Finished"
