# Alphabit Backend - Base Mini App Auth

Welcome to the Alphabit Backend service! This project handles authentication for the Alphabit Base Mini App using Farcaster Quick Auth and provides a robust API structure for your application logic.

## 🌟 Project Overview

This backend is built with **Node.js** and **Express**, utilizing **TypeScript** for type safety. It is designed with industry best practices in mind, featuring:

-   **Secure Authentication**: Verifies JWT tokens from Farcaster frames/mini-apps.
-   **Middleware Architecture**: Centralized authentication, error handling, and security logic.
-   **Controller Pattern**: Clean separation between routing and business logic.
-   **Security**: Integrated with `helmet` for HTTP headers and CORS protection.

## 📂 Project Structure

```
src/
├── config/         # Environment variables and constants
├── controllers/    # Business logic (Response handling)
├── middlewares/    # Request interceptors (Auth, Error, Logging)
├── routes/         # API Endpoint definitions
├── services/       # External integrations (Farcaster Quick Auth)
└── index.ts        # Application entry point
```

## 🔐 Authentication Flow

1.  **Identity Provider**: Farcaster (Frontend) generates a JWT token for the user.
2.  **Verification**: Your backend receives this token in the `Authorization` header.
3.  **Validation**: The `auth` middleware uses `@farcaster/quick-auth` to verify the token signature against your configured `DOMAIN`.
4.  **Access**: If valid, the user's Farcaster ID (FID) is attached to the request (`req.user.fid`) for use in controllers.

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   npm

### Installation
```bash
npm install
```

### Configuration
Create specific `.env` file:
```env
PORT=3000
NODE_ENV=development
# DOMAIN must match your mini-app's configured domain in Farcaster Developer Console
# For local dev, use your ngrok URL (e.g., f123.ngrok.io)
DOMAIN=your-mini-app-domain.com
CORS_ORIGIN=*
```

### Running the App
-   **Development**: `npm run dev` (Hot-reload enabled)
-   **Production**: `npm run build` && `npm start`

## 📡 API Documentation

### 1. System Endpoints (Public)

**GET /system/info**
Public info about the backend.

```bash
curl -v http://localhost:3000/system/info
```

**GET /system/health**
Health check.

### 2. User Endpoints (Protected)
Requires a valid Bearer token.

**GET /users/me**
Get authenticated user profile.

```bash
curl -v http://localhost:3000/users/me \
  -H "Authorization: Bearer <YOUR_VALID_TOKEN>"
```

*Success (200 OK):*
```json
{
  "success": true,
  "data": {
    "user": { "fid": 12345 }
  }
}
```

## 🛡️ Key Components

### Middleware
-   **`requireAuth`**: Protects routes; throws 401 if token is invalid.
-   **`errorHandler`**: Catches any errors in controllers and returns a standard JSON error response.
-   **`helmet`**: Sets security headers.
-   **`morgan`**: Logs incoming requests for debugging.

### Controllers
Logic is isolated in `src/controllers/`. For example, `authController` handles the response logic for user data, keeping your routes clean.
