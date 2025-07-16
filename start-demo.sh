#!/bin/bash
# Claude Agent Manager Demo Startup Script

echo "🚀 Starting Claude Agent Manager Demo"
echo "======================================"

# Check if Redis is running
if redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis not running - using in-memory storage"
    echo "   For production, install Redis: sudo apt install redis-server"
    echo ""
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Build if needed
if [ ! -d "packages/server/dist" ] || [ ! -d "packages/client/dist" ]; then
    echo "🏗️  Building packages..."
    npm run build
    echo ""
fi

echo "🌐 Starting services:"
echo "   Server: http://localhost:3001"
echo "   Client: http://localhost:3000"
echo "   WebSocket: ws://localhost:3001/ws"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start both server and client
npm run dev