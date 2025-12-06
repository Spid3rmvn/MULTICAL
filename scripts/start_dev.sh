#!/bin/bash
# ============================================
# MULTICAL - Development Startup Script
# ============================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting MULTICAL development environment..."
echo "============================================"

# Start backend in background
echo "[1/2] Starting FastAPI backend..."
cd "$PROJECT_ROOT/backend"
if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

python run.py &
BACKEND_PID=$!
echo "  Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
sleep 2

# Start frontend
echo "[2/2] Starting Electron frontend..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies..."
    npm install
fi

npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
