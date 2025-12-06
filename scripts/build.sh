#!/bin/bash
# ============================================
# MULTICAL - Production Build Script
# ============================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building MULTICAL for production..."
echo "============================================"

# Build frontend
echo "[1/2] Building Electron app..."
cd "$PROJECT_ROOT/frontend"
npm run build

echo "[2/2] Packaging complete!"
echo ""
echo "Build output: $PROJECT_ROOT/frontend/dist/"
echo "============================================"
