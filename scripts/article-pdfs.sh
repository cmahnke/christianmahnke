#!/bin/bash

SEARCH_DIR="docs"

if [ ! -d "$SEARCH_DIR" ]; then
    echo "Error: The directory '$SEARCH_DIR' was not found."
    exit 1
fi

echo "searcing for 'article.html' in '$SEARCH_DIR'..."

find "$SEARCH_DIR" -type f -name "article.html" | while read -r html_file; do
    pdf_file="${html_file%.html}.pdf"

    echo "Converting '$html_file' zu '$pdf_file'..."

    npx vivliostyle build --output "$pdf_file" "$html_file"
    if [ $? -eq 0 ]; then
        echo "'$pdf_file' created successfully"
    else
        echo "Error converting '$html_file'"
    fi
done

echo "Finished"
