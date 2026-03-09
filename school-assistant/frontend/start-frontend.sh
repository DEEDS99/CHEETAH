#!/bin/bash
# ========================================
# START FRONTEND — School Assistant Overlay
# ========================================
echo "🎓 Starting School Assistant Desktop App..."
cd "$(dirname "$0")"
npm install
echo "✅ Dependencies installed"
echo "🪟 Launching Electron overlay..."
echo "💡 Shortcut: Ctrl+Shift+S = toggle visibility"
echo "💡 Shortcut: Ctrl+Shift+A = instant AI scan"
npm start
