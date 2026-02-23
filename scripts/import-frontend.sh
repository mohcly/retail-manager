#!/usr/bin/env bash
# =================================================================
# import-frontend.sh
#
# Imports the retailscope-pro frontend code into the frontend/
# directory so it can be committed directly to this repository.
#
# Previously, the frontend was a private git submodule pointing to
# https://github.com/mohcly/retailscope-pro.git, which prevented
# CI agents (Copilot, etc.) from accessing the code.
#
# Usage:
#   ./scripts/import-frontend.sh [path-to-retailscope-pro]
#
# If no path is given, the script will attempt to clone using
# your existing Git credentials.
# =================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
RETAILSCOPE_REPO="https://github.com/mohcly/retailscope-pro.git"

if [ -n "${1:-}" ]; then
  SOURCE_DIR="$1"
  echo "📂 Copying frontend from local path: $SOURCE_DIR"
else
  SOURCE_DIR=$(mktemp -d)
  echo "📥 Cloning retailscope-pro into temp directory..."
  git clone --depth 1 "$RETAILSCOPE_REPO" "$SOURCE_DIR"
fi

if [ ! -d "$SOURCE_DIR/src" ]; then
  echo "❌ Error: $SOURCE_DIR does not look like a valid retailscope-pro checkout (missing src/)."
  exit 1
fi

# Clean the target (keep .gitkeep and README if present)
echo "🧹 Cleaning frontend/ directory..."
find "$FRONTEND_DIR" -mindepth 1 -not -name '.gitkeep' -not -name 'README.md' -exec rm -rf {} + 2>/dev/null || true

# Copy everything except .git
echo "📦 Copying frontend files..."
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' "$SOURCE_DIR/" "$FRONTEND_DIR/"

echo ""
echo "✅ Frontend code imported into frontend/"
echo ""
echo "Next steps:"
echo "  1. cd frontend && npm install"
echo "  2. git add frontend/"
echo "  3. git commit -m 'feat: embed frontend code directly (remove submodule)'"
echo ""
