#!/usr/bin/env bash
set -e

echo "=== TreasureNet Local Setup ==="
echo ""

# 1. Check prerequisites
echo "[1/6] Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm required: npm install -g pnpm"; exit 1; }
echo "  Node.js $(node -v), pnpm $(pnpm -v)"

# 2. Install dependencies
echo "[2/6] Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 3. Database setup
echo "[3/6] Setting up database..."
createdb treasurenet 2>/dev/null && echo "  Database created" || echo "  Database already exists"
cd packages/shared && npx prisma db push --skip-generate 2>/dev/null && cd ../..
echo "  Schema pushed"

# 4. Build
echo "[4/6] Building..."
pnpm --filter @treasurenet/shared run build
pnpm --filter @treasurenet/server run build
echo "  Build complete"

# 5. Start services
echo "[5/6] Starting services..."
brew services start redis 2>/dev/null || echo "  Redis: ensure it's running"
brew services start postgresql@16 2>/dev/null || echo "  PostgreSQL: ensure it's running"
sleep 1

# 6. Start server
echo "[6/6] Starting server..."
node apps/server/dist/main.js &
SERVER_PID=$!
sleep 3

# Test
echo ""
echo "=== Server running at http://localhost:4000 ==="
echo "  API docs: http://localhost:4000/api/docs"
echo ""
echo "Next steps:"
echo "  1. Start web: cd apps/web && pnpm dev"
echo "  2. Open http://localhost:3000/wallet"
echo "  3. Connect Freighter wallet (testnet)"
echo "  4. Promote to Game Master (enter admin key: treasurenet-admin-dev)"
echo ""
echo "  5. On mobile: create wallet to get a player address"
echo "  6. Issue SBT: node scripts/admin.js issue-sbt <player-address>"
echo ""
echo "Server PID: $SERVER_PID"
echo "To stop: kill $SERVER_PID"
