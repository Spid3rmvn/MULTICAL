#!/bin/bash
# ============================================
# MULTICAL - Initial Setup Script
# ============================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Setting up MULTICAL project..."
echo "============================================"

# Check requirements
echo "[1/4] Checking requirements..."
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting."; exit 1; }

echo "  ✓ Python 3 found: $(python3 --version)"
echo "  ✓ Node.js found: $(node --version)"
echo "  ✓ npm found: $(npm --version)"

# Setup backend
echo "[2/4] Setting up backend..."
cd "$PROJECT_ROOT/backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "  ✓ Backend dependencies installed"

# Setup frontend
echo "[3/4] Setting up frontend..."
cd "$PROJECT_ROOT/frontend"
npm install
echo "  ✓ Frontend dependencies installed"

# Create database directory
echo "[4/4] Creating database directory..."
mkdir -p "$PROJECT_ROOT/database"
mkdir -p "$PROJECT_ROOT/database/backups"
echo "  ✓ Database directories created"

echo ""
echo "============================================"
echo "Setup complete!"
echo ""
echo "To start development:"
echo "  ./scripts/start_dev.sh"
echo ""
echo "Or manually:"
echo "  Backend:  cd backend && source venv/bin/activate && python run.py"
echo "  Frontend: cd frontend && npm start"
echo "============================================"
