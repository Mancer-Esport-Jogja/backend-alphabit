# Alphabit Backend Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)

A robust Node.js/Express backend service for the usage of Alphabit Base Mini App. This service handles Farcaster Quick Auth verification, user session management, and provides system status endpoints.

## ✨ Features

-   **Authentication**: Secure Farcaster Quick Auth verification.
-   **Architecture**: Modular Controller-Service pattern with TypeScript.
-   **Security**: Integrated with `helmet` for secure headers and CORS protection.
-   **Logging**: Request logging via `morgan`.
-   **Dockerized**: Ready for containerized deployment.
-   **REST API**: Clean, resource-based URL structure.

## 🛠️ Tech Stack

-   **Runtime**: Node.js & Express
-   **Language**: TypeScript
-   **Auth**: @farcaster/quick-auth
-   **DevOps**: Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

-   Node.js v18+
-   npm or yarn
-   Docker (optional, for containerized run)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/backend-alphabit.git
    cd backend-alphabit
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Copy the example configuration file:
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your actual credentials:
    -   `DOMAIN`: Must match your Farcaster Mini-App domain.

### 🏃 Running the App

#### Local Development
Starts the server with hot-reloading enabled.
```bash
npm run dev
```

#### Production Build
Builds the TypeScript source and runs the optimized JS.
```bash
npm run build
npm start
```

#### Docker
Run the entire stack using Docker Compose.
```bash
docker-compose up --build -d
```

## 📚 API Documentation

### System
-   `GET /system/info` - Get service information and timestamp.
-   `GET /system/health` - Health check for load balancers.

### Users (Protected)
-   `GET /users/me` - Get authenticated user profile (Requires `Authorization: Bearer <token>`).

> For detailed API usage and code explanation, please refer to [explanation.md](./explanation.md).

## 📂 Project Structure

```
src/
├── config/         # Environment variables & constants
├── controllers/    # Request handlers (Business logic)
├── middlewares/    # Express middlewares (Auth, Error, logs)
├── routes/         # API Route definitions
├── services/       # External service integrations
└── index.ts        # App entry point
```
