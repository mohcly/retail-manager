#!/bin/sh
set -e

echo "=================================================="
echo "    RETAIL MANAGER (DJÂTÎ) - DEMO CONTAINER       "
echo "=================================================="

DATA_DIR=${DATA_DIR:-/app/data}
mkdir -p "$DATA_DIR"

# If localbridge.sqlite doesn't exist in DATA_DIR, copy from pre-seeded location
if [ ! -f "$DATA_DIR/localbridge.sqlite" ]; then
    echo "📦 Initializing Demo Database with Client Data (STIHL Mali & Holding Pro)..."
    cp /app/docker/localbridge.sqlite "$DATA_DIR/localbridge.sqlite"
fi

export DATA_DIR="$DATA_DIR"
export NODE_ENV=production

echo "🔧 Starting Local-Bridge Fastify Service on port 8787..."
cd /app/backend/local-bridge
PORT=8787 node dist/index.js &
BACKEND_PID=$!

echo "⏳ Waiting for backend to respond..."
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:8787/health > /dev/null 2>&1; then
        echo "✅ Local-Bridge Backend is HEALTHY!"
        break
    fi
    sleep 0.5
done

echo "🌐 Starting Retail Manager Web Server on port 3000..."
cd /app
PORT=3000 BACKEND_PORT=8787 node docker/server.mjs &
WEB_PID=$!

echo "=================================================="
echo "  🚀 App Ready: http://localhost:3000             "
echo "  🏢 Organizations: STIHL MALI / HOLDING PRO      "
echo "  👤 Accounts:                                    "
echo "     • Master STIHL:    master@stihl-mali.com     "
echo "     • Caisse STIHL:    caisse@stihl-mali.com     "
echo "     • Master Holding:  master@holding-pro.com    "
echo "     • Caisse Holding:  caisse@holding-pro.com    "
echo "     • Password:        Password123!              "
echo "=================================================="

# Wait for both processes
trap "kill $BACKEND_PID $WEB_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
