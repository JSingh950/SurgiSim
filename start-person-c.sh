#!/bin/bash

# Person C - 3D & UX Lead Startup Script
# This script helps you quickly start development and test new features

echo "🎨 Person C - 3D & UX Lead Environment Setup"
echo "=============================================="
echo ""

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "feature/person-c-3d-ux-enhancements" ]; then
    echo "⚠️  Warning: You're not on the Person C branch"
    echo "   Switch to your branch with: git checkout feature/person-c-3d-ux-enhancements"
    echo ""
fi

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

echo "✅ Dependencies installed!"
echo ""

# Check if brain model exists
if [ -f "frontend/public/models/brain.glb" ]; then
    echo "🧠 Real brain model detected!"
    echo "   Your brain.glb is ready to use"
else
    echo "📐 Using geometric brain placeholders"
    echo "   To add a real model: cp your-brain.glb frontend/public/models/brain.glb"
fi

echo ""
echo "🚀 Starting development servers..."
echo ""
echo "Terminal 1 (Backend): npm run dev:backend"
echo "Terminal 2 (Frontend): npm run dev:frontend"
echo ""
echo "📱 Open http://localhost:5173 when ready"
echo ""
echo "📚 Documentation:"
echo "   - PERSON_C_QUICKSTART.md - Quick start guide"
echo "   - PERSON_C_README.md - Comprehensive documentation"
echo ""
echo "🎯 Key Features to Test:"
echo "   ✅ 3D Brain interaction (rotate, zoom, click)"
echo "   ✅ AI surgical guidance"
echo "   ✅ Surgical step progression"
echo "   ✅ Tool selection"
echo "   ✅ Mint celebration animation"
echo ""
echo "💡 Tip: The current geometric brain works great for demo!"
echo "   Add a real brain.glb later for extra visual impact"
echo ""

# Ask if user wants to start servers
read -p "Start development servers now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting backend..."
    npm run dev:backend &
    BACKEND_PID=$!

    echo "Starting frontend..."
    npm run dev:frontend &
    FRONTEND_PID=$!

    echo ""
    echo "✅ Servers started!"
    echo "   Backend PID: $BACKEND_PID"
    echo "   Frontend PID: $FRONTEND_PID"
    echo ""
    echo "Press Ctrl+C to stop both servers"

    # Wait for interrupt signal
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
else
    echo "No problem! Start them manually when ready."
fi