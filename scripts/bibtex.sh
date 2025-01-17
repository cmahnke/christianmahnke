#!/usr/bin/env bash

BIBTEXS=$(find content -name "*.bibtex")

for BIBTEX in $BIBTEXS
do
  echo "Processing file $BITEX"
  academic import "$BIBTEX" "`dirname '$BIBTEX'`" 
done
