#!/usr/bin/env bash

PYTHON=`which python3.13`

if [ -z "$PYTHON" ] ; then
  PYTHON=`which python`
fi

$PYTHON scripts/indexer.py -c pagefind-index.yaml
