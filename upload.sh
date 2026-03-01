#!/bin/bash

# microKORG Custom Library Uploader
# Simple wrapper to upload the patch library

clear

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║          🎹 microKORG Custom Patch Library Uploader                    ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Verify files exist
UPLOADER="./cli/upload-with-erriez.cjs"
LIBRARY="./patches/custom-library-2026-02-28.syx"

if [ ! -f "$UPLOADER" ]; then
    echo "❌ Uploader not found: $UPLOADER"
    exit 1
fi

# Find latest library file
LIBRARY=$(ls -t ./patches/custom-library-*.syx 2>/dev/null | head -1)

if [ -z "$LIBRARY" ]; then
    echo "❌ No library file found in patches/"
    echo "   Run: bun run cli/create-custom-library-from-factory.cjs"
    exit 1
fi

# Show file info
echo "📦 Library File:"
FILENAME=$(basename "$LIBRARY")
echo "   File: $FILENAME"
SIZE=$(stat -f%z "$LIBRARY" 2>/dev/null || stat -c%s "$LIBRARY" 2>/dev/null)
echo "   Size: $SIZE bytes"
echo ""

# Run the uploader
bun run "$UPLOADER"
