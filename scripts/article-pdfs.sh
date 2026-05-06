#!/bin/bash

SEARCH_DIR="docs"
SCRIPT_LOCATION=`dirname "$(realpath $0)"`

VIVLIOSTYLE="$SCRIPT_LOCATION/../Source Files/Experiments/vivliostyle-batch-cli/src/vivliostyle-cli.ts"
VIVLIOSTYLE_NODE_PATH="$(dirname "$VIVLIOSTYLE")/../node_modules"

if [ ! -d "$SEARCH_DIR" ]; then
    echo "Error: The directory '$SEARCH_DIR' was not found."
    exit 1
fi

echo "searcing for 'article.html' in '$SEARCH_DIR'..."

find "$SEARCH_DIR" -type f -name "article.html" | while read -r html_file; do
    pdf_file="${html_file%.html}-print.pdf"
    pdf_file_web="${html_file%.html}.pdf"

    echo "Converting '$html_file' zu '$pdf_file'..."
    #NODE_PATH="$VIVLIOSTYLE_NODE_PATH" node "$VIVLIOSTYLE" -i "$html_file" --asset-base https://christianmahnke.de/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js -o "$pdf_file"
    npx vivliostyle build --output "$pdf_file" "$html_file"
    if [ $? -eq 0 ]; then
        echo "'$pdf_file' created successfully"
    else
        echo "Error converting '$html_file'"
    fi
    gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 -dPDFSETTINGS=/ebook -dFastWebView -dUseCropBox -dNOPAUSE -dBATCH -sOutputFile="$pdf_file_web" "$pdf_file"
done

echo "Finished"
