# Alphabit Backend Service

![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)

Backend service for the **Alphabit Web3 Mini-App** on Base. This service handles Farcaster Quick Auth verification, user management, market data integration with Thetanuts Finance, and provides a robust RESTful API.

## 🚀 Features

- **🔐 Authentication**: Secure Farcaster Quick Auth (JWT) verification.
- **🏗️ Architecture**: Modular Controller-Service-Route pattern with Dependency Injection.
- **📊 Analytics**: Real-time user PnL tracking, win rates, and trading volume analysis.
- **🏆 Leaderboard**: Event-driven daily, weekly, and all-time leaderboards with self-correcting rollups.
- **⚡ Integration**: Direct proxy and syncing with Thetanuts Finance v4 Indexer.
- **⚙️ Dynamic Config**: Database-backed configuration for critical runtime parameters (e.g., contract addresses).
- **📝 Documentation**: Auto-generated Swagger/OpenAPI 3.0 documentation.

## 🛠️ Tech Stack

| Category | Technology | Description |
|----------|------------|-------------|
| **Runtime** | Node.js 20+ | Core server runtime |
| **Framework** | Express 5.x | Robust web framework |
| **Language** | TypeScript 5.x | Typed development |
| **Database** | PostgreSQL | Relational data persistence |
| **ORM** | Prisma | Type-safe database client and migrations |
| **DevOps** | Docker, Docker Compose | Containerization and orchestration |

##  Getting Started

### Prerequisites
- Node.js v20+
- PostgreSQL
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd backend-alphabit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your database credentials and Farcaster configs.

4. **Initialize Database**
   ```bash
   npm run db:generate  # Generate Prisma Client
   npm run db:migrate   # Run migrations
   # or for simple dev sync:
   npm run db:push
   ```

### Running the App

| Mode | Command | URL | Notes |
|------|---------|-----|-------|
| **Development** | `npm run dev` | `http://localhost:3000` | Hot-reloading enabled |
| **Production** | `npm start` | `http://localhost:3000` | Optimized build |
| **Docker** | `docker-compose up -d` | `http://localhost:3000` | Full stack container |

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client based on schema |
| `npm run db:migrate` | Run database migrations (Production/Dev safe) |
| `npm run db:push` | Push schema changes directly (Dev only) |
| `npm run db:studio` | Open Prisma Studio GUI to view data |

## 📚 API Endpoints

The API is organized into several modules. All endpoints are prefixed with `/api`.

Interactive documentation (Swagger) is available at:
- **Local**: [http://localhost:3000/docs](http://localhost:3000/docs)

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Authenticate with Farcaster JWT. Creates/updates user profile. | Bearer |

### 👤 Users (`/users`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/me` | Get authenticated user's profile and stats. | Bearer |

### 📈 Analytics (`/user/analytics`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/summary` | Get aggregated PnL, Win Rate, and basic stats. | Bearer |
| `GET` | `/pnl-history` | Get historical PnL data for charts (24h/7d/30d/all). | Bearer |
| `GET` | `/distribution` | Get asset and strategy distribution breakdown. | Bearer |

### 🏆 Leaderboard (`/leaderboard`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Get ranked leaderboard. Supports filters: `period` (24h/7d/30d/all), `sortBy` (pnl/roi/volume/win_rate), `limit`. | Public |

### 🌰 Thetanuts Integration (`/nuts`)
These endpoints proxy the Thetanuts V4 Indexer or provide configuration.

**Public / Frontend Support**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/config` | Get contract addresses, ABIs, and referrer config. |
| `GET` | `/orders` | Fetch available option orders from Thetanuts. |
| `POST` | `/positions` | Get user positions and history (proxied). |
| `POST` | `/update` | Trigger indexer sync after a trade is executed on-chain. |
| `GET` | `/stats` | Get protocol statistics. |
| `POST` | `/payout/calculate` | Calculate potential payout for an option order. |

**Authenticated / User Data**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/trades/sync` | Force sync authenticated user's trades to local DB. | Bearer |
| `GET` | `/trades` | Get user's synced trades from local DB. | Bearer |
| `GET` | `/trades/stats` | Get user's trade statistics. | Bearer |
| `POST` | `/trades/sync-all` | (Admin) Sync trades for ALL users. | Admin Token |

### 📉 Market Data (`/market`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/klines` | Proxy for Binance historical candle data (Klines). | Public |

### ⚙️ System (`/system`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/info` | Service application info (version, uptime). | Public |
| `GET` | `/health` | Service health check. | Public |

## ⚙️ Configuration

Critical parameters can be updated at runtime via the Database (table `Configs`), falling back to `.env` if missing.

### Configurable Keys (Database)

| Key | Description | Default |
|-----|-------------|---------|
| `THETANUTS_INDEXER_URL` | Endpoint for Thetanuts Indexer | `.../api/v1` |
| `ALPHABIT_REFERRER_ADDRESS` | Address to tag trades for revenue share | *(empty)* |
| `SYNC_SCHEDULER_ENABLED` | Toggle background sync jobs (`true`/`false`) | `false` |
| `SYNC_INTERVAL_MS` | Interval for background sync | `900000` (15m) |

### Updating Configs
You can update these values without restarting the server using SQL or Prisma Studio.
```sql
UPDATE configs SET value = 'https://new-url.com' WHERE key = 'THETANUTS_INDEXER_URL';
```

## 🔒 Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `3000` |
| `NODE_ENV` | No | Environment (development/production) | `development` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | - |
| `DOMAIN` | **Yes** | Application domain for auth | - |
| `NEYNAR_API_KEY` | No | API Key for Farcaster profile data | - |
| `ADMIN_SYNC_TOKEN` | **Yes** | Secret token for admin endpoints | - |
| `SYNC_SCHEDULER_ENABLED` | No | Enable scheduler via Env | `false` |

## 📂 Project Structure

```bash
src/
├── config/         # App configuration & Envs
├── controllers/    # Request handlers (Input validation, Response formatting)
├── services/       # Business logic (DB operations, External API calls)
├── routes/         # Express route definitions
├── middlewares/    # Auth, Error handling, Logging
├── lib/            # Shared utilities (Prisma, Helpers)
└── docs/           # Swagger/OpenAPI Type definitions
```

## 📄 License

This project is licensed under the **MIT License**.
