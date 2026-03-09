#!/bin/bash
# ========================================
# START BACKEND — School Assistant
# ========================================
echo "🎓 Starting School Assistant Backend..."
cd "$(dirname "$0")"
npm install
echo "✅ Dependencies installed"
echo "🚀 Server starting on http://localhost:3001"
node src/index.js
