# Subscription Management Backend

A clean, production-style SaaS subscription backend built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **Authentication & Authorization**: User registration, login, and profile fetching with bcrypt password hashing and JWT authentication. Simple role-based access control (`USER` and `ADMIN`).
- **Subscription Plans**: Full CRUD operations on subscription plans (Admin only for creation, update, and deletion). Public catalog showing only active plans.
- **Subscription Lifecycle**:
  - One active subscription per user at any time.
  - Automatic calculation of subscription expiration based on plan duration.
  - Subscription cancellation with status updated to `CANCELLED`.
  - Subscription renewal that extends the end date.
  - Dynamic expiry detection: subscriptions past their end date are automatically treated and updated as `EXPIRED`.
  - User isolation ensuring users can only view and manage their own subscriptions.
- **Plan Usage & Limits**: Dedicated endpoint exposing the user's active plan quotas (`maxProjects`, `maxStorage`) and subscription validity.
- **Data Validation & Error Handling**: Request body validation returning standard 400 bad request errors and a centralized error handling middleware without leaking internal details.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Local)
- **ODM**: Mongoose
- **Authentication**: JSON Web Tokens (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Configuration**: dotenv

## Folder Structure

```
src/
  config/
    db.ts
  controllers/
    auth.controller.ts
    plan.controller.ts
    subscription.controller.ts
  middleware/
    auth.middleware.ts
    admin.middleware.ts
    error.middleware.ts
  models/
    User.ts
    Plan.ts
    Subscription.ts
  routes/
    auth.routes.ts
    plan.routes.ts
    subscription.routes.ts
  utils/
    jwt.ts
  app.ts
  server.ts
```

## Local MongoDB Setup

Make sure MongoDB Community Server is installed and running locally:

- **Windows Service**: Check `Services` and ensure `MongoDB Server` is running.
- **Manual Start**:
  ```powershell
  mongod --dbpath "C:\data\db"
  ```
- **Default Local Connection URI**:
  ```
  mongodb://127.0.0.1:27017/subscription_service
  ```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Variables:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server listening port | `5000` |
| `MONGO_URI` | Local MongoDB connection URI | `mongodb://127.0.0.1:27017/subscription_service` |
| `JWT_SECRET` | Secret key used to sign JWTs | `your_secret_here` |
| `JWT_EXPIRES_IN` | Expiration window for JWTs | `7d` |

## Installation & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Build TypeScript for production**:
   ```bash
   npm run build
   ```

4. **Run production build**:
   ```bash
   npm start
   ```

## Authentication Flow

1. **Register**: Send `POST /api/auth/register` with `name`, `email`, and `password`. The system creates a user with `role: "USER"` (or `"ADMIN"`) and returns a JWT token.
2. **Login**: Send `POST /api/auth/login` with `email` and `password`. On success, the response includes the JWT token.
3. **Protected Requests**: Include the header `Authorization: Bearer <token>` in subsequent requests to access authenticated endpoints.

## Subscription Flow

1. User views active plans via `GET /api/plans`.
2. User subscribes to a plan using `POST /api/subscriptions` with `{ "planId": "<plan_id>" }`.
3. The server ensures:
   - The plan exists and `isActive` is `true`.
   - The user does not currently hold an active, unexpired subscription.
   - Sets `startDate` to now and computes `endDate = startDate + durationInDays`.
4. User checks current status via `GET /api/subscriptions/current` and resource limits via `GET /api/subscriptions/usage`.
5. User can cancel with `PATCH /api/subscriptions/:id/cancel` or renew with `PATCH /api/subscriptions/:id/renew`.

## API Endpoints

### 1. Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |

### 2. Plans

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/plans` | Public | List all active plans |
| `GET` | `/api/plans/:id` | Public | Get single plan details by ID |
| `POST` | `/api/plans` | Admin | Create a new subscription plan |
| `PATCH` | `/api/plans/:id` | Admin | Update an existing plan |
| `DELETE` | `/api/plans/:id` | Admin | Delete a plan |

### 3. Subscriptions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/subscriptions` | Authenticated | Subscribe to an active plan |
| `GET` | `/api/subscriptions/current` | Authenticated | Get user's current subscription |
| `GET` | `/api/subscriptions/usage` | Authenticated | Get current plan limits & usage info |
| `PATCH` | `/api/subscriptions/:id/cancel` | Authenticated | Cancel an active subscription |
| `PATCH` | `/api/subscriptions/:id/renew` | Authenticated | Renew an existing subscription |

## Example Request Bodies

### Register User
`POST /api/auth/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

### Create Plan (Admin Only)
`POST /api/plans`
```json
{
  "name": "Pro Plan",
  "description": "Ideal for growing teams and projects",
  "price": 29.99,
  "durationInDays": 30,
  "features": ["Unlimited Exports", "Priority Support", "Custom Branding"],
  "maxProjects": 25,
  "maxStorage": 50000,
  "isActive": true
}
```

### Subscribe to Plan
`POST /api/subscriptions`
```json
{
  "planId": "65fc1b2e4f1a2b3c4d5e6f7a",
  "autoRenew": true
}
```

### Usage Response Example
`GET /api/subscriptions/usage`
```json
{
  "success": true,
  "message": "Usage details retrieved successfully",
  "data": {
    "plan": {
      "name": "Pro Plan",
      "maxProjects": 25,
      "maxStorage": 50000
    },
    "subscription": {
      "status": "ACTIVE",
      "startDate": "2026-09-28T14:30:00.000Z",
      "endDate": "2026-10-28T14:30:00.000Z"
    }
  }
}
```
