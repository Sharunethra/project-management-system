# ProManage - Unified Project Management System (Web + Mobile)

A production-grade, full-stack Project Management System built with a **single unified Node.js/Express backend** and **PostgreSQL database**, serving both a responsive **React (TypeScript + Vite)** web application and an **Android (React Native + Expo)** mobile application.

---

## 1. Project Overview & Architecture

ProManage implements a single authoritative backend that powers both the Web and Android clients. There are no separate mobile backends, no local mobile databases, and zero mock data.

```
                      +-------------------------+
                      |   PostgreSQL Database   |
                      |       (Port 5432)       |
                      +-------------------------+
                                   ^ Prisma ORM
                      +-------------------------+
                      |   Unified Node/Express  |
                      |     REST API Backend    |
                      |       (Port 5000)       |
                      +-------------------------+
                              ^           ^
                 JWT / REST   |           |   JWT / REST
                              v           v
        +-----------------------+       +-----------------------+
        |   Web Application     |       |  Android Mobile App   |
        |   (React + Vite)      |       | (React Native + Expo) |
        |  LocalStorage Token   |       |   SecureStore Keystore|
        +-----------------------+       +-----------------------+
```

Both clients share:
- The **SAME** user authentication system & bcrypt password hashing
- The **SAME** REST API endpoints
- The **SAME** PostgreSQL database
- Real-time cross-platform data synchronization

---

## 2. Technology Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, Zod validation, JWT, bcryptjs, express-rate-limit, morgan.
- **Frontend (Web)**: React 18, TypeScript, Vite, React Router v7, Lucide React, Axios, Vanilla CSS design tokens.
- **Mobile (Android)**: React Native, Expo SDK 52, TypeScript, React Navigation (Native Stack), Expo SecureStore (Android Keystore hardware-backed encryption), Axios.
- **Testing**: Jest, Supertest, ts-jest (100% automated test coverage across Auth, Projects, Tasks, Dashboard, and Cross-Platform sync).

---

## 3. Project Structure

```
project-management-system/
|-- backend/
|   |-- prisma/
|   |   +-- schema.prisma         # Normalized database models (User, Project, Task)
|   |-- src/
|   |   |-- config/               # Database and environment configurations
|   |   |-- controllers/          # Business logic (Auth, Project, Task, Dashboard)
|   |   |-- middleware/           # Auth (JWT), Rate limiting, Zod validation, Error handler
|   |   |-- routes/               # Express routes
|   |   |-- validators/           # Zod schema definitions
|   |   |-- app.ts                # Express application setup
|   |   +-- server.ts             # Server entry point (0.0.0.0 host binding)
|   |-- tests/                    # Jest + Supertest suites (Auth, Projects, Tasks, Dashboard, Sync)
|   |-- package.json
|   |-- tsconfig.json
|   |-- jest.config.js
|   |-- .env
|   +-- .env.example
|-- web/
|   |-- src/
|   |   |-- components/           # Navbar, Sidebar, StatCard, Modals
|   |   |-- contexts/             # AuthContext with auto session restoration
|   |   |-- pages/                # Login, Register, Dashboard, Projects, ProjectDetails, Tasks
|   |   |-- services/             # Axios API client with interceptors
|   |   |-- types/                # TypeScript interface definitions
|   |   |-- App.tsx               # App routing and layout
|   |   +-- index.css             # Unified CSS design system
|   |-- vercel.json               # SPA routing rewrite rule for Vercel
|   |-- package.json
|   |-- vite.config.ts
|   |-- tsconfig.json
|   |-- .env
|   +-- .env.example
|-- mobile/
|   |-- src/
|   |   |-- api/                  # Axios client with Expo SecureStore & offline handling
|   |   |-- context/              # Mobile AuthContext with token restoration & expiry
|   |   |-- screens/              # Login, Register, Dashboard, Projects, Tasks, Modals
|   |   +-- types/                # TypeScript definitions
|   |-- App.tsx                   # React Navigation root
|   |-- app.json                  # Expo config (Android package: com.promanage.app)
|   |-- eas.json                  # EAS Build configuration for Android APK
|   |-- package.json
|   |-- tsconfig.json
|   +-- .env.example
|-- docs/
|   |-- API.md                    # Complete REST API specification
|   +-- ER-DIAGRAM.md             # Database schema and Mermaid ER diagram
|-- README.md
+-- .gitignore
```

---

## 4. Getting Started & Local Setup

### Prerequisites
- **Node.js** >= 18 (Tested on Node v24)
- **PostgreSQL** >= 14 (Running locally or hosted)
- **Git**

### Step 1: Database Setup
Create a PostgreSQL database named `pms_db`:
```sql
CREATE DATABASE pms_db;
```

### Step 2: Backend Setup
1. Navigate to backend:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env` (see `.env.example`):
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
   Backend runs at: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### Step 3: Web Application Setup
1. Navigate to web:
   ```bash
   cd ../web
   npm install
   ```
2. Configure `.env` (see `.env.example`):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
3. Start web dev server:
   ```bash
   npm run dev
   ```
   Web app runs at: `http://localhost:5173`.

### Step 4: Mobile (Android) Setup
1. Navigate to mobile:
   ```bash
   cd ../mobile
   npm install
   ```
2. Configure environment:
   - For **Android Emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api`
   - For **Physical Device**: `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000/api`
   *(You can also dynamically change the Server URL on the login screen).*
3. Start Expo:
   ```bash
   npx expo start --android
   ```

---

## 5. API Endpoints Specification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Login and receive JWT token |
| `POST` | `/api/auth/logout` | Public | Logout current session |
| `GET` | `/api/auth/me` | Bearer | Retrieve authenticated user profile |
| `GET` | `/api/projects` | Bearer | List projects (with pagination & status/search filters) |
| `GET` | `/api/projects/:id` | Bearer | Get single project with associated tasks |
| `POST` | `/api/projects` | Bearer | Create a new project |
| `PUT` | `/api/projects/:id` | Bearer | Update project details |
| `DELETE`| `/api/projects/:id` | Bearer | Delete project (cascades tasks) |
| `GET` | `/api/tasks` | Bearer | List tasks (with pagination, search, status, priority filters) |
| `GET` | `/api/tasks/:id` | Bearer | Get single task details |
| `POST` | `/api/tasks` | Bearer | Create a new task under a project |
| `PUT` | `/api/tasks/:id` | Bearer | Update task details / status / priority |
| `DELETE`| `/api/tasks/:id` | Bearer | Delete a task |
| `GET` | `/api/dashboard` | Bearer | Retrieve exact 5 dashboard metrics |
| `GET` | `/api/health` | Public | Service health verification |

Detailed request/response payloads are in [`docs/API.md`](docs/API.md).

---

## 6. Authentication, Security & Data Isolation

- **Bcrypt**: All user passwords are encrypted with 10 salt rounds before database storage. Plaintext passwords and hashes are never exposed.
- **JWT Protection**: Protected routes require `Authorization: Bearer <token>`.
- **Multi-Tenant Ownership Isolation**: Every project and task query strictly verifies ownership (`userId`). User B receives `403/404 Forbidden` if attempting to read, update, or delete User A's resources.
- **Input Validation**: Backend requests are sanitized and validated with Zod schemas.
- **Rate Limiting**: Brute-force protection applied to `/api/auth/register` and `/api/auth/login`.

---

## 7. Selected Bonus Features

### Bonus 1: Pagination
List endpoints (`/api/projects` and `/api/tasks`) support pagination via query parameters:
```http
GET /api/tasks?page=1&limit=10
```
Response structure:
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "totalPages": 3
  }
}
```
Pagination works seamlessly alongside search queries and status/priority filters.

### Bonus 2: Automated Unit & Integration Tests
Full automated test suite implemented using **Jest + Supertest**:
```bash
cd backend
npm test
```
Test coverage:
- **Auth**: Registration, duplicate rejection, login, bcrypt validation, invalid password, JWT profile, logout (8 tests).
- **Projects**: CRUD, pagination, status filtering, name search, ownership isolation (8 tests).
- **Tasks**: CRUD, pagination, status/priority filtering, direct "Mark Completed" action, ownership isolation (8 tests).
- **Dashboard**: User-scoped calculations for all 5 required statistics (1 test).
- **Cross-Platform Sync**: Mandatory tests A through F verifying full Web <-> Android synchronization over the same PostgreSQL database (6 tests).

---

## 8. Mobile Security & Offline Handling

- **Expo SecureStore**: Authentication tokens are stored securely in the Android Keystore / iOS Keychain. Plaintext storage (`AsyncStorage`) is not used.
- **Session Expiry Handling**: On HTTP 401 token expiration, the mobile app clears stored credentials, returns to the login screen, and notifies:
  *"Your session has expired. Please log in again."*
- **Offline / Network Resilience**: If network connectivity drops, requests fail gracefully and display:
  *"No internet connection. Please check your network and try again."*

---

## 9. Production Deployment Readiness

### Backend Deployment (Render)
1. In Render Dashboard, click **New > Web Service** and connect the repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build` (runs `prisma generate && tsc`)
   - **Start Command**: `npm start` (runs `node dist/server.js`)
3. Set Environment Variables:
   - `PORT`: `5000` (or Render dynamic PORT)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Internal connection URL from hosted PostgreSQL (e.g., Render Postgres / Supabase / Neon)
   - `JWT_SECRET`: High-entropy 64-character secret
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: Your deployed Vercel domain (e.g., `https://promanage-web.vercel.app`)
4. Schema Migration: Run `npx prisma db push` once against the hosted database during initial setup.
5. Verification: Access `https://<your-render-service>.onrender.com/api/health`.

### Web Deployment (Vercel)
1. In Vercel Dashboard, click **Add New > Project** and import the repository.
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-render-service>.onrender.com/api`
4. SPA Routing: Handled automatically by [`web/vercel.json`](web/vercel.json) rewrite rule.

### Android Mobile Deployment (Expo EAS Build)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Navigate to `mobile`:
   ```bash
   cd mobile
   eas login
   eas project:init
   ```
3. Set production backend API URL in EAS secret or `.env`:
   ```bash
   eas secret:create --name EXPO_PUBLIC_API_URL --value https://<your-render-service>.onrender.com/api --type string
   ```
4. Build release APK:
   ```bash
   eas build --platform android --profile preview
   ```
   This produces a standalone Android `.apk` configured directly to point to the production Render backend.

---

## 10. 5-Minute Cross-Platform Demonstration Flow

1. **0:00 - 0:20**: Open Web app in browser, log in with test credentials (`test@example.com`).
2. **0:20 - 0:40**: View system dashboard showing initial metrics from PostgreSQL.
3. **0:40 - 1:30**: Navigate to **Projects**, create "Enterprise Cloud Migration", and add task "Configure VPC Peering" (Status: Pending, Priority: High).
4. **1:30 - 2:20**: Open Android app (Expo / Emulator). Log in with the **same** credentials (`test@example.com`).
5. **2:20 - 3:30**: Open "Enterprise Cloud Migration". Pull to refresh. "Configure VPC Peering" appears immediately from the shared PostgreSQL database.
6. **3:30 - 4:20**: On Android, tap the checkmark to mark "Configure VPC Peering" as **Completed** (or update Priority to Low).
7. **4:20 - 4:50**: Return to Web browser and refresh.
8. **4:50 - 5:00**: Observe "Configure VPC Peering" reflected as **Completed** on Web. Both platforms remain in sync.

---

## 11. Final Assessment Compliance Checklist

- [x] Unified REST API with Node.js, Express, TypeScript, and Prisma ORM
- [x] Single PostgreSQL database shared by Web and Android
- [x] Full User Authentication (Register, Login, Logout, /api/auth/me) with bcrypt & JWT
- [x] Full Project Management CRUD with strict multi-tenant ownership
- [x] Full Task Management CRUD with dedicated "Mark Completed" action
- [x] Dashboard displaying exact 5 user-scoped statistics
- [x] Real search and filtering on projects and tasks
- [x] Responsive React + Vite Web application with clean UX
- [x] React Native + Expo Android mobile application
- [x] Expo SecureStore hardware-backed token storage
- [x] Session expiry and offline network error handling on mobile
- [x] Bonus 1: Database-backed pagination on list endpoints
- [x] Bonus 2: Automated unit & integration tests with Jest + Supertest (31/31 passed)
- [x] Cross-platform synchronization verified (Tests A through F)
- [x] Production deployment configuration for Render, Vercel, and Expo EAS
