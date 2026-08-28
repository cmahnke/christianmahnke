#!/usr/bin/env bash

set -e -o pipefail

echo "Generating QR-codes"

python scripts/qr-codes.py

echo "Removing QR-Code templates"

find docs -name qrcode.json -exec rm {} \;
