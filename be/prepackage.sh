#!/bin/bash

set -euxo pipefail

SERVE_PAGES_DIR="pages"
SERVE_DIR=".webpack/serveHtml"

# Step 1. Serve HTML
if [ -d "${SERVE_DIR}" ]; then
  cp -rf "${SERVE_PAGES_DIR}" "${SERVE_DIR}"
  echo "Add ${SERVE_PAGES_DIR} to ${SERVE_DIR}"
else
  echo "Skip because ${SERVE_DIR} doesn't exist."
fi
