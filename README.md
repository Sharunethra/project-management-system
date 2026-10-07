# ProManage — Unified Project Management System (Web + Mobile)

A production-grade, full-stack Project Management System built with a **single unified Node.js/Express backend** and **PostgreSQL database**, serving both a responsive **React (TypeScript + Vite)** web application and an **Android (React Native + Expo)** mobile application.

---

## Architecture Overview

```
                      +-------------------------+
                      ¦   PostgreSQL Database   ¦
                      ¦       (Port 5432)       ¦
                      +-------------------------+
                                   ¦ Prisma ORM
                      +-------------------------+
                      ¦   Unified Node/Express  ¦
                      ¦     REST API Backend    ¦
                      ¦       (Port 5000)       ¦
                      +-------------------------+
                              ¦           ¦
                 JWT / REST   ¦           ¦   JWT / REST
                              ?           ?
        +-----------------------+       +-----------------------+
        ¦   Web Application     ¦       ¦  Android Mobile App   ¦
        ¦   (React + Vite)      ¦       ¦ (React Native + Expo) ¦
        ¦  LocalStorage Token   ¦       ¦   SecureStore (Keystore)
        +-----------------------+       +-----------------------+
```

Both clients share:
- The **SAME** user authentication system & bcrypt password hashing
- The **SAME** REST API endpoints
- The **SAME** PostgreSQL database
- Zero mock data; full real-time cross-platform data synchronization

---

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, Zod validation, JWT, bcryptjs, morgan, express-rate-limit.
- **Frontend (Web)**: React 18, TypeScript, Vite, React Router v7, Lucide React, Axios, Vanilla CSS design tokens.
- **Mobile (Android)**: React Native, Expo SDK 52, TypeScript, React Navigation (Native Stack), Expo SecureStore (Android Keystore hardware-backed encryption), Axios.
- **Testing**: Jest, Supertest, ts-jest (100% automated test coverage for Auth, Projects, Tasks, Dashboard, and Cross-Platform sync).

---

## Project Structure

```
project-management-system/
+-- backend/
¦   +-- prisma/
¦   ¦   +-- schema.prisma         # Normalized database models (User, Project, Task)
¦   +-- src/
¦   ¦   +-- config/               # Database and environment configurations
¦   ¦   +-- controllers/          # Business logic (Auth, Project, Task, Dashboard)
¦   ¦   +-- middleware/           # Auth (JWT), Rate limiting, Zod validation, Error handler
¦   ¦   +-- routes/               # API routes
¦   ¦   +-- validators/           # Zod schema definitions
¦   ¦   +-- app.ts                # Express application setup
¦   ¦   +-- server.ts             # Server entry point
¦   +-- tests/                    # Jest + Supertest suites (Auth, Projects, Tasks, Dashboard, Sync)
¦   +-- package.json
¦   +-- tsconfig.json
¦   +-- jest.config.js
¦   +-- .env
¦   +-- .env.example
+-- web/
¦   +-- src/
¦   ¦   +-- components/           # Navbar, Sidebar, StatCard, Modals
¦   ¦   +-- contexts/             # AuthContext with auto session restoration
¦   ¦   +-- pages/                # Login, Register, Dashboard, Projects, ProjectDetails, Tasks
¦   ¦   +-- services/             # Axios API client with interceptors
¦   ¦   +-- types/                # TypeScript interface definitions
¦   ¦   +-- App.tsx               # App routing and layout
¦   ¦   +-- index.css             # Design system
¦   +-- package.json
¦   +-- vite.config.ts
¦   +-- tsconfig.json
¦   +-- .env
¦   +-- .env.example
+-- mobile/
¦   +-- src/
¦   ¦   +-- api/                  # Axios client with Expo SecureStore & offline handling
¦   ¦   +-- context/              # Mobile AuthContext with token restoration & expiry
¦   ¦   +-- screens/              # Login, Register, Dashboard, Projects, Tasks, Modals
¦   ¦   +-- types/                # TypeScript definitions
¦   +-- App.tsx                   # React Navigation root
¦   +-- app.json                  # Expo config (Android package: com.promanage.app)
¦   +-- eas.json                  # EAS Build configuration for Android APK
¦   +-- package.json
¦   +-- tsconfig.json
¦   +-- .env.example
+-- docs/
¦   +-- API.md                    # Complete REST API documentation
¦   +-- ER-DIAGRAM.md             # Database schema and Mermaid ER diagram
+-- README.md
+-- .gitignore
```

---

## Getting Started & Local Setup

### 1. Prerequisites
- **Node.js** >= 18 (Tested on Node v24.11.1)
- **PostgreSQL** >= 14 (Running locally or hosted)
- **Git**

### 2. Database Setup
Create a PostgreSQL database named `pms_db`:
```sql
CREATE DATABASE pms_db;
```

### 3. Backend Setup
1. Navigate to backend:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env` (copy from `.env.example`):
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/pms_db?schema=public"
   JWT_SECRET="your_secure_jwt_secret_key"
   JWT_EXPIRES_IN="7d"
   NODE_ENV=development
   CORS_ORIGIN=*
   ```
3. Push schema to database:
   ```bash
   npx prisma db push
   ```
4. Start backend:
   ```bash
   npm run dev
   ```
   Backend runs at: `http://localhost:5000`

### 4. Web Application Setup
1. Navigate to web:
   ```bash
   cd ../web
   npm install
   ```
2. Configure `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
3. Start web dev server:
   ```bash
   npm run dev
   ```
   Web runs at: `http://localhost:5173`

### 5. Mobile (Android) Setup
1. Navigate to mobile:
   ```bash
   cd ../mobile
   npm install
   ```
2. Configure `.env`:
   - For **Android Emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api`
   - For **Physical Device**: `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000/api`
   *(You can also tap "Configure Server URL" directly on the mobile login screen).*
3. Start Expo:
   ```bash
   npx expo start --android
   ```

---

## Running Automated Tests

All tests are implemented using **Jest + Supertest** against the live PostgreSQL database:
```bash
cd backend
npm test
```
Test suites cover:
- **Auth**: User registration, unique email constraint, bcrypt verification, login, invalid password, JWT `/auth/me`, logout.
- **Projects**: CRUD, pagination, name search, status filtering, multi-tenant ownership enforcement.
- **Tasks**: CRUD, pagination, status/priority filtering, direct "Mark as Completed" action.
- **Dashboard**: Authenticated user metrics calculation (exact 5 metrics).
- **Cross-Platform Sync**: Mandatory tests A through F verifying Web <-> Android synchronization over the same database.

---

## Mobile Security & Hardware Keystore Storage

- **Expo SecureStore**: JWT tokens are stored directly in the Android Keystore / iOS Keychain, never in plaintext `AsyncStorage`.
- **Session Expiry**: If a token expires (HTTP 401), the app clears the token, redirects to the login screen, and displays:
  `"Your session has expired. Please log in again."`
- **Offline / Network Resiliency**: When network connectivity is absent or unreachable, the app intercepts the failure and presents:
  `"No internet connection. Please check your network and try again."`

---

## 5-Minute Cross-Platform Demonstration

1. **0:00 - 0:20**: Open Web app at `http://localhost:5173`, register or log in with test credentials (`test@example.com`).
2. **0:20 - 0:40**: View system dashboard showing real-time metrics.
3. **0:40 - 1:30**: Navigate to **Projects**, create "Enterprise Cloud Migration", and add task "Configure VPC Peering" (Status: Pending, Priority: High).
4. **1:30 - 2:20**: Open Android app (Expo / Emulator). Log in with the **same** credentials (`test@example.com`).
5. **2:20 - 3:30**: Open "Enterprise Cloud Migration". Pull to refresh. "Configure VPC Peering" appears immediately from the PostgreSQL database.
6. **3:30 - 4:20**: On Android, tap the checkmark to mark "Configure VPC Peering" as **Completed** (or cycle Priority to Low).
7. **4:20 - 4:50**: Return to Web browser and refresh.
8. **4:50 - 5:00**: Observe "Configure VPC Peering" reflected as **Completed** on Web.
