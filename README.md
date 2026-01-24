# Alphabit Backend Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-purple.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)

Backend service for **Alphabit Web3 Mini-App** on Base. Handles Farcaster Quick Auth verification, user management, and provides RESTful API endpoints.

#### Nuts - Trades (Admin)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/nuts/trades/sync-all` | Sync all users trades to database | x-admin-token |

---

## ✨ Features

- Authentication - Farcaster Quick Auth JWT verification
- Database - PostgreSQL with Prisma ORM (v7.2)
- API Docs - Interactive Swagger UI (development only)
- Architecture - Modular Controller-Service-Route pattern
- Leaderboard - Event-driven daily buckets for 24h/7d/30d/all (self-correcting rollups)
- Security - Helmet headers + CORS protection
- Logging - Request logging via Morgan
- Docker - Container-ready deployment

- 🔐 **Authentication** - Farcaster Quick Auth JWT verification
- 🗃️ **Database** - PostgreSQL with Prisma ORM (v7.2)
- 📚 **API Docs** - Interactive Swagger UI (development only)
- 🏗️ **Architecture** - Modular Controller-Service-Route pattern
- 🛡️ **Security** - Helmet headers + CORS protection
- 📝 **Logging** - Request logging via Morgan
- 🐳 **Docker** - Container-ready deployment

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express 5.x |
| Language | TypeScript 5.9 |
| Database | PostgreSQL |
| ORM | Prisma 7.2 |
| Auth | @farcaster/quick-auth |
| Docs | Swagger/OpenAPI 3.0 |
| DevOps | Docker & Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- PostgreSQL database
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/backend-alphabit.git
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
   
   Update `.env` with your credentials:
   ```env
   PORT=3000
   NODE_ENV=development
   DOMAIN=your-mini-app-domain.com
   CORS_ORIGIN=*
   DATABASE_URL="postgresql://user:password@localhost:5432/alphabit?schema=public"
   ```

4. **Setup Database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations (first time)
   npm run db:migrate
   
   # Or push schema directly (development)
   npm run db:push
   ```

---

## 🏃 Running the App

### Development
```bash
npm run dev
```
Server starts at `http://localhost:3000` with hot-reload enabled.

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up --build -d
```

---

## 📚 API Documentation

### Swagger UI

Interactive API documentation available at:
```
http://localhost:3000/api/docs
```
> ⚠️ **Note**: Swagger UI is automatically disabled in production (`NODE_ENV=production`).

### Endpoints

#### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth` | Authenticate/register user | ✅ Bearer |

#### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user profile | ✅ Bearer |

#### System
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/system/info` | Service information | ❌ |
| GET | `/api/system/health` | Health check | ❌ |
| GET | `/api/health` | Root health check | ❌ |

#### Analytics (Protected)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/analytics/summary` | Get PnL, Win Rate & Stats | ✅ Bearer |
| GET | `/api/user/analytics/pnl-history?period=1d/7d/30d/all` | Get PnL chart data. default: 30d | ✅ Bearer |
| GET | `/api/user/analytics/distribution?period=1d/7d/30d/all` | Get Asset/Strategy breakdown. default: all | ✅ Bearer |

#### Leaderboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/leaderboard?period=24h/7d/30d/all&sortBy=pnl\|roi\|volume\|win_rate&limit=10&page=1 | Bucketed daily rollup leaderboard (event-driven, self-correcting). Defaults: period=all, sortBy=pnl, limit=10, page=1. | ❌ |

#### Nuts - Thetanuts Finance (Public)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/nuts/config` | Get contracts, ABIs, referrer | ❌ |
| GET | `/api/nuts/orders` | Get available orders | ❌ |
| POST | `/api/nuts/positions` | Get user positions/history | ❌ |
| POST | `/api/nuts/update` | Trigger sync after trade | ❌ |
| GET | `/api/nuts/stats` | Get protocol stats | ❌ |
| POST | `/api/nuts/payout/calculate` | Calculate option payout | ❌ |

#### Nuts - Trades (Protected)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/nuts/trades/sync` | Sync trades to database | ✅ Bearer |
| GET | `/api/nuts/trades` | Get user trades from DB | ✅ Bearer |
| GET | `/api/nuts/trades/stats` | Get trade statistics | ✅ Bearer |

#### Nuts - Trades (Admin)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/nuts/trades/sync-all` | Sync all users trades to database | x-admin-token |

---

## 🗄️ Database Schema

```prisma
model User {
  id                 String   @id @default(cuid())
  fid                BigInt   @unique

  // Farcaster profile (from Neynar)
  username           String?  @unique
  displayName        String?
  pfpUrl             String?
  primaryEthAddress  String?  @db.VarChar(42)

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  lastActiveAt       DateTime @default(now())

  trades             TradeActivity[]
}

model TradeActivity {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(...)
  
  optionAddress   String      // Thetanuts option contract
  txHash          String      @unique
  status          TradeStatus // OPEN | SETTLED | EXPIRED
  
  underlyingAsset String      // BTC | ETH
  optionType      String      // CALL_SPREAD | PUT_BUTTERFLY etc
  isCall          Boolean
  isLong          Boolean
  strikes         Json        // Strike prices array
  expiryTimestamp DateTime
  
  entryTimestamp    DateTime
  entryBlock        Int?
  
  // Financial data
  entryPremium      String
  entryFeePaid      String
  numContracts      String
  collateralAmount  String
  
  // Settlement
  settlementPrice           String?
  payoutBuyer               String?
  collateralReturnedSeller  String?
  exercised                 Boolean?
  oracleFailure             Boolean?
  
  // Close info
  closeTimestamp    DateTime?
  closeTxHash       String?
  closeBlock        Int?
  
  explicitClose     Json?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Config {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run migrations (dev) |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npx prisma db seed` | Seed initial config data |

---

## ⚙️ Dynamic Configuration

The application supports **dynamic configuration** stored in the database. This allows updating settings without restarting the service.

### Configurable Keys

| Key | Description | Default |
|-----|-------------|---------|
| `THETANUTS_INDEXER_URL` | Thetanuts indexer API URL | `.../api/v1` |
| `ALPHABIT_REFERRER_ADDRESS` | Referrer wallet address | *(empty)* |
| `SYNC_SCHEDULER_ENABLED` | Enable/disable background sync | `false` |
| `SYNC_DELAY_AFTER_UPDATE` | Delay (ms) after indexer update | `10000` |
| `SYNC_INTERVAL_MS` | Sync interval (ms) - Dynamic | `900000` (15m) |

### How It Works

1. **ConfigService** checks the `configs` table in the database
2. If found, uses the database value
3. If not found, falls back to `.env` value

### Updating Configuration

**Via SQL:**
```sql
UPDATE configs SET value = '30000' WHERE key = 'SYNC_INTERVAL_MS'; -- 30 seconds
```

**Via Prisma Studio:**
```bash
npx prisma studio
```

> ✅ All changes take effect immediately on nature scheduler cycle - no restart needed.

---

## 🔄 Hybrid Sync Scheduler

The service implements a **Hybrid Sync Strategy** to keep trade data fresh with minimal API overhead.

| Strategy | Trigger | Flow |
|----------|---------|------|
| **On-Demand** | User opens portfolio | Fetch specific user's positions + history |
| **Post-Trade** | After `fillOrder` | Trigger indexer update → Wait 10s → Sync user |
| **Scheduled** | Every 15 mins | Trigger indexer update (1x) → Sync **ALL** active users |

### Scheduler Features
- **Smart Update**: Triggers indexer update only once per cycle to save resources.
- **Referrer Filter**: Only syncs trades where `referrer` matches `ALPHABIT_REFERRER_ADDRESS`.
- **Dynamic Control**: Pause/resume scheduler via database config (`SYNC_SCHEDULER_ENABLED`) without downtime.

---

## 📂 Project Structure

```
src/
├── config/           # Environment & app configuration
│   ├── env.ts        # Environment variables
│   └── swagger.ts    # Swagger configuration
├── controllers/      # Request handlers
│   ├── authController.ts
│   ├── userController.ts
│   └── systemController.ts
├── docs/             # API documentation (OpenAPI specs)
│   ├── index.ts      # Documentation exports
│   ├── schemas.ts    # Shared schema definitions
│   ├── auth.ts       # Auth endpoints docs
│   ├── users.ts      # Users endpoints docs
│   └── system.ts     # System endpoints docs
├── generated/        # Prisma generated client
├── lib/              # Shared libraries
│   └── prisma.ts     # Prisma client singleton
├── middlewares/      # Express middlewares
│   ├── auth.ts       # Authentication middleware
│   └── errorHandler.ts
├── routes/           # API route definitions
│   ├── index.ts      # Route aggregator
│   ├── auth.ts
│   ├── users.ts
│   └── system.ts
├── services/         # Business logic & external services
│   ├── auth.ts       # Auth service (token verification)
│   └── configService.ts  # Dynamic config from DB
└── index.ts          # Application entry point

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Database seeding script
```

---

## 🔒 Authentication

This service uses **Farcaster Quick Auth** for authentication.

### Authentication Flow

```
1. FE: Connect wallet in mini-app → Get walletAddress
2. FE: Farcaster Quick Auth → Get JWT token (contains FID)
3. FE: POST /api/auth with Bearer token + walletAddress
4. BE: Verify token → Extract FID → Create/Update user
```

### Request Format
```http
Authorization: Bearer <farcaster-jwt-token>
Content-Type: application/json
```

### Token Payload
The JWT token from Farcaster Quick Auth contains:
- `sub` - Farcaster ID (FID)

> **Note:** FID is extracted from the verified token and cannot be faked.

### Development Bypass
In development mode (`NODE_ENV=development`), use:
```
Authorization: Bearer dev-token
```
This returns a mock user with `fid: 999999`.

---

## 🧪 Testing API

### Using cURL

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Authenticate/Register User (Protected):**
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Authorization: Bearer dev-token"
```

**Get User Profile (Protected):**
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer dev-token"
```

**Sync All Trades (Admin):**
```bash
curl -X POST http://localhost:3000/api/nuts/trades/sync-all \
  -H "x-admin-token: your-admin-token"
```

---

## 📄 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment | No | `development` |
| `DOMAIN` | Farcaster Mini-App domain | Yes | - |
| `CORS_ORIGIN` | Allowed CORS origins | No | `*` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `NEYNAR_API_KEY` | Neynar API key for Farcaster profile data | No | - |
| `ADMIN_SYNC_TOKEN` | Admin token for `/api/nuts/trades/sync-all` | Yes (for admin sync) | - |
| `SYNC_SCHEDULER_ENABLED` | Enable background scheduler | No | `false` |
| `SYNC_INTERVAL_MS` | Scheduler interval in ms | No | `900000` |
| `SYNC_DELAY_AFTER_UPDATE` | Delay after indexer update (ms) | No | `10000` |

---

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

---

## 📜 License

This project is licensed under the MIT License.

