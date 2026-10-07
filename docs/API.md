# ProManage REST API Specification

Comprehensive API documentation for the **Project Management System (Web + Mobile)**. Both the React web application and React Native Android application communicate with this single unified backend.

**Base URL**: `http://localhost:5000/api` (Local) | `http://10.0.2.2:5000/api` (Android Emulator)

---

## Authentication & Headers

Protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` HTTP header:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Authentication**: None (Public)
- **Rate Limited**: Yes (Brute-force protection)
- **Request Body**:
```json
{
  "fullName": "Sarah Connor",
  "email": "sarah@example.com",
  "password": "Password123!"
}
```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "status": "success",
      "message": "User registered successfully",
      "token": "eyJhbGciOi...",
      "user": {
        "id": "e0b8a1c2-3d4e-4f5a-8b9c-0d1e2f3a4b5c",
        "fullName": "Sarah Connor",
        "email": "sarah@example.com",
        "createdAt": "2026-10-07T05:00:00.000Z"
      }
    }
    ```
  - `400 Bad Request`: Validation failure or duplicate email (`"An account with this email address already exists"`).

---

### 1.2 Login User
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Authentication**: None (Public)
- **Rate Limited**: Yes
- **Request Body**:
```json
{
  "email": "sarah@example.com",
  "password": "Password123!"
}
```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "message": "Login successful",
      "token": "eyJhbGciOi...",
      "user": {
        "id": "e0b8a1c2-3d4e-4f5a-8b9c-0d1e2f3a4b5c",
        "fullName": "Sarah Connor",
        "email": "sarah@example.com",
        "createdAt": "2026-10-07T05:00:00.000Z"
      }
    }
    ```
  - `401 Unauthorized`: Invalid email or password.

---

### 1.3 Logout User
- **Method**: `POST`
- **Endpoint**: `/api/auth/logout`
- **Authentication**: Optional
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "message": "Logged out successfully"
    }
    ```

---

### 1.4 Get Current User Profile
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Authentication**: Required (`Bearer <token>`)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "user": {
        "id": "e0b8a1c2-3d4e-4f5a-8b9c-0d1e2f3a4b5c",
        "fullName": "Sarah Connor",
        "email": "sarah@example.com",
        "createdAt": "2026-10-07T05:00:00.000Z",
        "updatedAt": "2026-10-07T05:00:00.000Z"
      }
    }
    ```
  - `401 Unauthorized`: Missing, invalid, or expired token.

---

## 2. Project Endpoints

### 2.1 Get Projects (with Search, Filter & Pagination)
- **Method**: `GET`
- **Endpoint**: `/api/projects`
- **Authentication**: Required
- **Query Parameters**:
  - `search` *(optional)*: Filter by project name (case-insensitive)
  - `status` *(optional)*: Filter by status (`Not Started` | `In Progress` | `Completed`)
  - `page` *(optional, default: 1)*: Page number
  - `limit` *(optional, default: 10)*: Results per page
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "9a38f72c-1234-4567-89ab-cdef01234567",
          "userId": "e0b8a1c2-3d4e-4f5a-8b9c-0d1e2f3a4b5c",
          "name": "Mobile App Launch",
          "description": "Complete Android app rollout",
          "status": "In Progress",
          "startDate": "2026-10-01T00:00:00.000Z",
          "endDate": "2026-10-31T00:00:00.000Z",
          "createdAt": "2026-10-07T05:00:00.000Z",
          "updatedAt": "2026-10-07T05:00:00.000Z",
          "_count": {
            "tasks": 3
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
    ```

---

### 2.2 Get Project by ID
- **Method**: `GET`
- **Endpoint**: `/api/projects/:id`
- **Authentication**: Required (Strict Ownership Verified)
- **Responses**:
  - `200 OK`: Returns project object with attached child `tasks`.
  - `404 Not Found`: Project does not exist or belongs to another user.

---

### 2.3 Create Project
- **Method**: `POST`
- **Endpoint**: `/api/projects`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Mobile App Launch",
  "description": "Complete Android app rollout",
  "status": "In Progress",
  "startDate": "2026-10-01T00:00:00.000Z",
  "endDate": "2026-10-31T00:00:00.000Z"
}
```
- **Responses**:
  - `201 Created`: Returns created project object.
  - `400 Bad Request`: Validation failure.

---

### 2.4 Update Project
- **Method**: `PUT`
- **Endpoint**: `/api/projects/:id`
- **Authentication**: Required (Strict Ownership Verified)
- **Request Body**: Any editable fields (`name`, `description`, `status`, `startDate`, `endDate`).
- **Responses**:
  - `200 OK`: Returns updated project object.
  - `404 Not Found`: If project does not exist or belongs to another user.

---

### 2.5 Delete Project
- **Method**: `DELETE`
- **Endpoint**: `/api/projects/:id`
- **Authentication**: Required (Strict Ownership Verified)
- **Responses**:
  - `200 OK`: `{"status": "success", "message": "Project deleted successfully"}`
  - `404 Not Found`: If project does not exist or belongs to another user.

---

## 3. Task Endpoints

### 3.1 Get Tasks (Search, Filter, Pagination)
- **Method**: `GET`
- **Endpoint**: `/api/tasks`
- **Authentication**: Required
- **Query Parameters**:
  - `projectId` *(optional)*: Filter tasks for specific project
  - `search` *(optional)*: Search task name (case-insensitive)
  - `status` *(optional)*: `Pending` | `In Progress` | `Completed`
  - `priority` *(optional)*: `Low` | `Medium` | `High`
  - `page` *(optional, default: 1)*: Page number
  - `limit` *(optional, default: 10)*: Results per page
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "7b8c9d0e-5678-4321-9876-ba0987654321",
          "projectId": "9a38f72c-1234-4567-89ab-cdef01234567",
          "userId": "e0b8a1c2-3d4e-4f5a-8b9c-0d1e2f3a4b5c",
          "name": "Configure Expo SecureStore",
          "description": "Store auth token in hardware keystore",
          "priority": "High",
          "status": "Completed",
          "dueDate": "2026-10-15T00:00:00.000Z",
          "createdAt": "2026-10-07T05:00:00.000Z",
          "updatedAt": "2026-10-07T05:10:00.000Z",
          "project": {
            "id": "9a38f72c-1234-4567-89ab-cdef01234567",
            "name": "Mobile App Launch"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
    ```

---

### 3.2 Get Task by ID
- **Method**: `GET`
- **Endpoint**: `/api/tasks/:id`
- **Authentication**: Required (Strict Ownership Verified)
- **Responses**:
  - `200 OK`: Returns task object.
  - `404 Not Found`: Task does not exist or belongs to another user.

---

### 3.3 Create Task
- **Method**: `POST`
- **Endpoint**: `/api/tasks`
- **Authentication**: Required (Validates project ownership)
- **Request Body**:
```json
{
  "projectId": "9a38f72c-1234-4567-89ab-cdef01234567",
  "name": "Configure Expo SecureStore",
  "description": "Store auth token in hardware keystore",
  "priority": "High",
  "status": "Pending",
  "dueDate": "2026-10-15T00:00:00.000Z"
}
```
- **Responses**:
  - `201 Created`: Returns created task.
  - `404 Not Found`: If target project does not belong to the user.

---

### 3.4 Update Task (Status, Priority, Details, or "Mark as Completed")
- **Method**: `PUT`
- **Endpoint**: `/api/tasks/:id`
- **Authentication**: Required (Strict Ownership Verified)
- **Request Body**: Any editable fields:
```json
{
  "status": "Completed"
}
```
- **Responses**:
  - `200 OK`: Returns updated task object.
  - `404 Not Found`: If task does not belong to user.

---

### 3.5 Delete Task
- **Method**: `DELETE`
- **Endpoint**: `/api/tasks/:id`
- **Authentication**: Required (Strict Ownership Verified)
- **Responses**:
  - `200 OK`: `{"status": "success", "message": "Task deleted successfully"}`
  - `404 Not Found`: If task does not belong to user.

---

## 4. Dashboard Endpoints

### 4.1 Get Dashboard Statistics
- **Method**: `GET`
- **Endpoint**: `/api/dashboard`
- **Authentication**: Required (Calculated strictly for authenticated user)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "data": {
        "totalProjects": 3,
        "totalTasks": 12,
        "completedTasks": 8,
        "pendingTasks": 4,
        "projectsInProgress": 2,
        "recentProjects": [...],
        "recentTasks": [...]
      }
    }
    ```

---

## 5. Standard Error Format

All error responses return uniform JSON:
```json
{
  "status": "error",
  "message": "Human-readable explanation of error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    }
  ]
}
```
