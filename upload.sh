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

if [ ! -f "$LIBRARY" ]; then
    echo "❌ Library file not found: $LIBRARY"
    echo "   Run: bun run cli/create-custom-library.cjs"
    exit 1
fi

# Show file info
echo "📦 Library File:"
echo "   File: custom-library-2026-02-28.syx"
SIZE=$(stat -f%z "$LIBRARY" 2>/dev/null || stat -c%s "$LIBRARY" 2>/dev/null)
echo "   Size: $SIZE bytes"
echo ""

# Run the uploader
bun run "$UPLOADER"
