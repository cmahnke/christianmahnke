#!/usr/bin/env bash

cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .
cd hdr-parser
GOOS=js GOARCH=wasm go build -o main.wasm main.go
