# 🏴‍☠️ TreasureNet

**A blockchain-backed real-world geolocation treasure hunting game powered by Stellar.**

TreasureNet is an AR-style geolocation game where players physically travel to real-world locations to discover clues that eventually reveal the location of an escrowed Stellar reward. Smart contracts on Soroban serve as the trust layer for all rewards.

> **Stellar Community Fund Submission** - TreasureNet combines Stellar testnet transactions with real-world GPS gameplay, using Freighter wallet for authentication and on-chain payments.

## 📸 Screenshots

### Wallet Connected State
<!-- Replace with actual screenshot -->
![Wallet Connected](docs/screenshots/wallet-connected.png)

*Freighter wallet connected, showing the user's Stellar public key with green connection indicator.*

### Balance Displayed
<!-- Replace with actual screenshot -->
![Balance Display](docs/screenshots/balance.png)

*Live testnet XLM balance fetched from Horizon API and displayed in the wallet.*

### Successful Testnet Transaction
<!-- Replace with actual screenshot -->
![Transaction Success](docs/screenshots/transaction-success.png)

*Transaction submitted successfully on Stellar Testnet with hash and explorer link.*

### Transaction Result
<!-- Replace with actual screenshot -->
![Transaction Result](docs/screenshots/transaction-result.png)

*Transaction hash, status, and link to Stellar Expert explorer shown to the user after submission.*

---

## 🚀 Setup Instructions (Run Locally)

### Prerequisites

- **macOS** (or Linux with equivalent package manager)
- **Homebrew** (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`)
- **Freighter Wallet** browser extension ([install here](https://freighter.app))

### Setup

#### 1. Install dependencies

```bash
brew install postgresql@16 redis node@20
brew services start postgresql@16
brew services start redis
```

#### 2. Clone and install

```bash
git clone https://github.com/greenarmor/treasurenet.git
cd treasurenet
npm install -g pnpm
pnpm install
```

#### 3. Create the database

```bash
createdb treasurenet
# If that fails: psql -U postgres -c "CREATE DATABASE treasurenet;"
```

#### 4. Configure environment

```bash
cp apps/server/.env.example apps/server/.env
```

Create `apps/web/.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

#### 5. Run database migrations

```bash
cd packages/shared
npx prisma migrate dev --name init
cd ../..
```

#### 6. Start the application

```bash
pnpm dev
```

This starts both the API server (port 4000) and web app (port 3000).

### Alternative: Docker

```bash
docker compose up -d
```

### Test the Wallet

1. Open http://localhost:3000/wallet
2. Click "Connect Freighter Wallet"
3. Ensure Freighter is set to **Testnet** network
4. Fund your testnet wallet at https://laboratory.stellar.org/#account-creator
5. Your balance will appear on the wallet page
6. Send a test transaction to any Stellar testnet address
7. View the transaction result and explorer link

> **Note**: Redis is optional for local development. The app runs without it - anti-cheat location caching is skipped gracefully.

### Services

| Service  | Port | URL                          |
| -------- | ---- | ---------------------------- |
| Web App  | 3000 | http://localhost:3000         |
| API      | 4000 | http://localhost:4000         |
| Swagger  | 4000 | http://localhost:4000/api/docs |
| Postgres | 5432 | postgresql://localhost:5432/treasurenet |
| Redis    | 6379 | redis://localhost:6379        |

---

## ✨ Features

- **Stellar Wallet Integration** - Connect Freighter wallet, view testnet balance, send XLM transactions
- **Real-World Treasure Hunts** - Create and solve geolocation-based treasure hunts with GPS-validated clues
- **Stellar Smart Contracts** - All rewards escrowed on-chain via Soroban smart contracts
- **Anti-Cheat Protection** - GPS drift detection, impossible travel checks, speed validation, nonce replay protection
- **Player Progression** - XP, levels, badges, leaderboards, and achievements
- **Real-Time Updates** - WebSocket-powered live player movement, clue unlocks, and treasure claims
- **Mobile-First** - PWA-ready web app + React Native Expo mobile app with background location
- **Multi-Role** - Game Masters create hunts, Players discover and claim them

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                    Clients                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Next.js  │  │  React   │  │   Freighter   │  │
│  │   Web    │  │  Native  │  │    Wallet     │  │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
└───────┼─────────────┼───────────────┼───────────┘
        │             │               │
   ┌────▼─────────────▼───────────────▼───────────┐
   │              NestJS Backend                    │
   │  Auth │ Game │ Escrow │ Geo │ Leaderboard     │
   │  Notifications │ Analytics │ Scheduler        │
   └────┬──────────────┬──────────────┬───────────┘
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────────────┐
   │PostgreSQL│   │  Redis  │   │ Soroban Contracts│
   │(Prisma)  │   │ (Cache) │   │  (Stellar Chain) │
   └─────────┘   └─────────┘   └─────────────────┘
```

## 📁 Project Structure

```
treasurenet/
├── apps/
│   ├── web/          # Next.js PWA frontend
│   ├── mobile/       # React Native Expo mobile app
│   └── server/       # NestJS backend API
├── packages/
│   ├── shared/       # Shared types, constants, utilities, validators
│   │   └── prisma/   # Database schema & migrations
│   ├── sdk/          # Client SDK (coming soon)
│   └── ui/           # Shared UI components (coming soon)
├── contracts/
│   └── treasure-hunt/ # Soroban Rust smart contract
├── docker/           # Dockerfiles
├── .github/
│   └── workflows/    # CI/CD pipelines
├── docker-compose.yml
├── turbo.json        # Turborepo config
└── package.json      # Workspace root
```

## 🔗 Smart Contract

The Treasure Hunt contract on Soroban manages the entire escrow lifecycle:

- `create_hunt()` - Register a new treasure hunt
- `fund_hunt()` - Lock reward tokens in the contract escrow
- `activate_hunt()` - Make the hunt live for players
- `claim_reward()` - Transfer reward to winner (after GPS + anti-cheat validation)
- `refund()` - Return funds to Game Master if hunt expires
- `pause()` / `resume()` - Pause or resume an active hunt
- `cancel()` - Cancel before activation

### Build & Test Contracts

```bash
cd contracts
make build   # Compile to WASM
make test    # Run contract tests
```

## 🛡️ Anti-Cheat System

TreasureNet implements multiple layers of anti-cheat protection:

1. **GPS Drift Detection** - Rejects locations with accuracy > 20m
2. **Impossible Travel** - Flags movements > 10km with insufficient time
3. **Speed Checks** - Maximum speed capped at 50 km/h
4. **Replay Protection** - Nonce-based location proofs prevent replay attacks
5. **Timestamp Validation** - Location proofs expire after 5 minutes
6. **Device Integrity** - Optional SafetyNet / DeviceCheck integration points

## 📡 API Endpoints

| Method | Path                    | Description                  |
| ------ | ----------------------- | ---------------------------- |
| POST   | /api/v1/auth/nonce      | Get authentication nonce     |
| POST   | /api/v1/auth/login      | Login with wallet signature  |
| POST   | /api/v1/auth/refresh    | Refresh access token         |
| POST   | /api/v1/hunt            | Create a treasure hunt       |
| GET    | /api/v1/hunts           | Get nearby hunts             |
| GET    | /api/v1/hunt/:id        | Get hunt details             |
| POST   | /api/v1/hunt/:id/join   | Join a hunt                  |
| POST   | /api/v1/clue/unlock     | Unlock a clue (GPS validated)|
| POST   | /api/v1/claim           | Claim treasure               |
| GET    | /api/v1/leaderboard     | Global leaderboard           |
| GET    | /api/v1/leaderboard/weekly | Weekly leaderboard        |
| GET    | /api/v1/profile         | Player profile               |
| GET    | /api/v1/notifications   | Get notifications            |
| GET    | /api/v1/analytics/dashboard | Analytics dashboard      |

Full API docs available at `/api/docs` when the server is running.

## 🛠️ Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Blockchain   | Stellar + Soroban (Rust)            |
| Wallet       | Freighter Browser Extension         |
| Backend      | NestJS, TypeScript, Prisma, BullMQ  |
| Frontend     | Next.js 14, React 18, TailwindCSS   |
| Mobile       | React Native Expo                   |
| Maps         | MapLibre GL / react-native-maps     |
| Database     | PostgreSQL 16                       |
| Cache/Queue  | Redis 7 + BullMQ                    |
| Real-time    | Socket.IO                           |
| Auth         | JWT + Stellar Wallet Signatures     |
| Monorepo     | Turborepo + pnpm workspaces         |
| CI/CD        | GitHub Actions, Docker              |

## 📊 Database

Prisma schema includes 12 models covering users, wallets, hunts, clues, attempts, player progression, badges, game events, leaderboards, notifications, sessions, and nonces.

See `packages/shared/prisma/schema.prisma` for the complete schema.

## 🧪 Testing

```bash
pnpm test              # Run all tests
pnpm run contracts:test # Run contract tests
pnpm run lint           # Lint all packages
pnpm run typecheck      # Type-check all packages
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## 📜 License

MIT
