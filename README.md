# RateIQ — Intelligent Store Rating & Reputation Platform

**From Ratings to Real Insights.**

RateIQ is a full-stack store rating and reputation platform designed around a simple idea:

> A rating is useful, but the context behind the rating is even more useful.

The platform supports three roles — **Administrator, Normal User, and Store Owner** — and covers the complete store-rating workflow from account management and store discovery to rating submission, monitoring, and reputation analytics.

Built as a full-stack implementation of the **Roxiler FullStack Intern Coding Challenge**, RateIQ also adds a lightweight, explainable intelligence layer for rating confidence, store health, trends, unusual activity, ranking, and insights.

---

## Product Focus

RateIQ is organized around three actions:

**Discover** → Find and compare stores using ratings, confidence, health, reviews, and improvement signals.

**Understand** → Look beyond a single average rating using trends, distributions, confidence, health, and explainable insights.

**Decide** → Use rating context to make better-informed store and reputation decisions.

---

## Core Platform Features

### Authentication & Role-Based Access

- One login system for all application roles
- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Protected API endpoints
- Role-specific navigation and dashboards
- Secure password-change flow
- Logout functionality

### Roles

| Role | Primary Responsibilities |
|---|---|
| **Administrator** | Manage users, stores, ratings, risks, audits, and reports |
| **Normal User** | Discover stores, submit ratings, update ratings, and manage their account |
| **Store Owner** | Monitor store reputation, customer ratings, trends, and insights |

---

# Administrator Control Center

The Administrator area provides centralized platform management.

### Dashboard

- Total users
- Total stores
- Total submitted ratings
- Average platform rating
- Platform health and risk signals

### User Management

- Create users
- Create administrators
- Create store owners
- Search users
- Filter by role
- Search by name, email, and address
- Sort tabular data in ascending/descending order
- Activate/deactivate users
- Edit user details
- Display owner rating information

### Store Management

- Add stores
- Edit stores
- Assign store owners
- Search stores
- Sort store data
- View store rating
- View rating count
- View store health
- Manage store contact information

### Rating Management

- View submitted ratings
- View rating customers
- View rating timestamps
- Sort rating records

### Risk Center

- Monitor unusual rating activity
- Show baseline activity
- Show deviation signals
- Categorize unusual activity as low/medium/high attention
- Clearly distinguish anomaly detection from proof of fraudulent reviews

### Audit Center

- Trace important administrative actions
- Record actor, action, entity, entity ID, and timestamp

### Reports

- User reports
- Store reports
- Rating reports
- CSV export from the Reports screen

---

# Normal User Experience

### Account

- Sign up
- Log in
- Update password
- Log out

### Store Explorer

- View registered stores
- Search by store name or address
- Filter by minimum rating
- Filter by minimum health
- Rank by:
  - Highest rating
  - Most trusted / confidence
  - Most reviewed
  - Highest health
  - Most improved

### Store Details

- Overall rating
- Rating count
- Rating distribution
- Rating confidence
- Store health
- Rating trend
- Explainable RateIQ insight
- User's own submitted rating
- Submit rating from 1–5
- Update an existing rating

### My Ratings

- Review personal rating history
- See rated stores and submitted values
- Sort the displayed rating data

---

# Store Owner Experience

### Owner Dashboard

- View owned stores
- View average rating
- View rating count
- View reputation health
- Review store-level performance

### Customer Ratings

- See users who submitted ratings
- See submitted rating values
- See dates/timestamps

### Analytics

- Rating distribution
- Rating confidence
- Store health
- Rating trend
- Performance context

### Insights

RateIQ turns calculated rating signals into readable explanations rather than displaying unexplained scores.

---

# RateIQ Intelligence Layer

The intelligence layer is deterministic and explainable. It does not depend on an external AI API.

## Rating Confidence

Confidence increases with rating volume so a small sample is not presented as equally reliable as a larger sample.

Current implementation:

```text
confidence = 100 × (1 − e^(-ratingCount / 20))
```

The result is capped at 100.

This is intentionally a simple, explainable confidence signal rather than a claim of statistical certification.

## Store Health

Store Health combines several reputation signals into a 0–100 indicator.

Current weighting:

| Signal | Weight |
|---|---:|
| Rating Quality | 35% |
| Rating Confidence | 25% |
| Recent Trend | 20% |
| Rating Stability | 10% |
| Engagement | 10% |

The score is designed as a product-level reputation indicator, not a financial, compliance, or business certification metric.

## Rating Trend

The current implementation compares:

- Most recent 30 days
- Previous 30-day period

Trend classification:

```text
Change > +2%  → IMPROVING
Change < -2%  → DECLINING
Otherwise     → STABLE
```

## Activity Anomaly Detection

The anomaly detector examines daily rating counts over the previous 30 days.

It compares the current activity against the mean and standard deviation of the period and highlights unusually high activity.

A detected anomaly means **unusual activity**, not proof of fake reviews.

## Smart Ranking

The Store Explorer can rank stores by more than raw average rating:

- Rating
- Confidence
- Review count
- Health
- Improvement

This gives users multiple ways to interpret reputation.

## Explainable Insights

RateIQ provides readable explanations such as:

- Strong rating but limited confidence because of low rating volume
- Rating performance is improving
- Rating performance is declining
- Rating performance is currently stable

---

# Notifications

The platform includes notification support with:

- User-specific notifications
- Notification types
- Read/unread state
- Password-change notification support
- Backend notification persistence

---

# Validation

The application enforces the challenge validation rules on relevant user/account forms.

| Field | Rule |
|---|---|
| Name | 20–60 characters |
| Address | Maximum 400 characters |
| Password | 8–16 characters |
| Password | At least one uppercase letter |
| Password | At least one special character |
| Email | Standard email validation |
| Rating | Integer value from 1 to 5 |

Validation is implemented with Zod and is checked on the backend for account/user operations.

Store management also validates email format and address length.

---

# Rating Integrity

A normal user can have **one rating per store**.

When the same user rates the same store again, the existing rating is updated instead of creating a duplicate.

The database enforces this with:

```text
unique(userId, storeId)
```

---

# Search, Filtering & Sorting

RateIQ provides:

### Search

- Users by name, email, and address
- Stores by name, address, and store email

### Filtering

- User role
- Minimum store rating
- Minimum store health

### Sorting

Key table columns support ascending/descending sorting with visible direction indicators.

Examples include:

- Name
- Email
- Role
- Rating
- Owner Rating
- Status
- Date
- Customer
- Store

---

# Security

The application includes practical security protections:

- bcrypt password hashing
- JWT authentication
- Role-based authorization
- Protected API routes
- Helmet security headers
- CORS configuration
- Express rate limiting
- Request validation with Zod
- Environment-based secrets/configuration
- Database constraints for rating integrity

The real `.env` file is intentionally excluded from version control.

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- React Hook Form
- Zod
- Recharts
- Redux Toolkit / React Redux
- CSS-based responsive UI

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- Zod
- Morgan

## Development

- npm
- Git
- GitHub
- Postman

---

# Architecture

```text
┌──────────────────────────────────────┐
│       React + TypeScript UI          │
│  Dashboards · Forms · Charts · RBAC  │
└──────────────────┬───────────────────┘
                   │ REST / JSON
                   ▼
┌──────────────────────────────────────┐
│      Express + TypeScript API        │
│ Auth · RBAC · Validation · Routes    │
│ Ratings · Admin · Owner · Reports    │
└──────────────────┬───────────────────┘
                   │ Prisma ORM
                   ▼
┌──────────────────────────────────────┐
│             PostgreSQL               │
│ Users · Stores · Ratings · Logs      │
│ Notifications                        │
└──────────────────────────────────────┘
```

The backend also contains deterministic intelligence utilities for confidence, health, trends, anomalies, and insights.

Detailed architecture and algorithm notes are available in `docs/`.

---

# Database Design

The core relational model contains:

```text
User
Store
Rating
Notification
AuditLog
```

### Important relationships

```text
User ───────< Rating >────── Store
  │                           │
  ├──────────< Notification   │
  │                           │
  └──────────< AuditLog       │
                              │
                           ownerId
                              │
                              ▼
                             User
```

### Database practices

- Foreign-key relationships
- Unique user/store rating constraint
- Indexes on frequently queried fields
- Timestamp fields
- Enum-based roles/statuses
- Referential actions for dependent records
- Normalized relational structure

---

# Project Structure

```text
rateiq-store-rating-platform/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── store.tsx
│   │   ├── types.ts
│   │   └── vite-env.d.ts
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   ├── algorithms/
│   │   ├── anomaly-detection.md
│   │   ├── health-score.md
│   │   ├── rating-confidence.md
│   │   └── rating-trend.md
│   ├── architecture.md
│   └── intelligence.md
│
├── postman/
│   └── RateIQ.postman_collection.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

# Getting Started

## Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

## 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/rateiq-store-rating-platform.git
cd rateiq-store-rating-platform
```

## 2. Configure PostgreSQL

Create a PostgreSQL database named:

```text
rateiq
```

Then create:

```text
backend/.env
```

using `backend/.env.example` as the template.

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rateiq?schema=public"
JWT_SECRET="your-development-secret"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

Never commit the real `.env` file.

## 3. Start Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate status
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## 4. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Seeded Demo Data

The backend seed script creates demo users, stores, ratings, notifications, and an audit record.

### Administrator

```text
admin@rateiq.com
```

### Store Owner

```text
owner1@rateiq.com
```

### Normal User

```text
user1@rateiq.com
```

The corresponding development passwords are defined in `backend/prisma/seed.ts`.

For local development, the seed can be run with:

```bash
cd backend
npm run seed
```

---

# API Surface

The backend exposes REST endpoints covering:

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/password
```

### Stores

```text
GET    /api/stores
GET    /api/stores/:id
GET    /api/stores/:id/health
GET    /api/stores/:id/trends
GET    /api/stores/:id/confidence
GET    /api/stores/:id/my-rating
```

### Ratings

```text
POST   /api/ratings
```

### Owner

```text
GET    /api/owner/dashboard
GET    /api/owner/ratings
GET    /api/owner/analytics
GET    /api/owner/insights
```

### Administrator

```text
GET    /api/admin/overview
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/stores
POST   /api/admin/stores
PUT    /api/admin/stores/:id
DELETE /api/admin/stores/:id
GET    /api/admin/ratings
GET    /api/admin/risks
```

### Platform Utilities

```text
GET    /api/risks
GET    /api/audit-logs
GET    /api/notifications
PATCH  /api/notifications/:id/read
GET    /api/reports/users
GET    /api/reports/stores
GET    /api/reports/ratings
GET    /api/analytics/overview
```

---

# Postman

A Postman collection is included here:

```text
postman/RateIQ.postman_collection.json
```

It can be imported into Postman to exercise the API flows for:

- Authentication
- Users
- Stores
- Ratings
- Owner workflows
- Admin workflows
- Notifications
- Reports
- Analytics
- Risk endpoints

---

# Verification

The project has been locally verified through:

### Frontend production build

```bash
cd frontend
npm run build
```

### Backend TypeScript verification

```bash
cd backend
npx tsc --noEmit
```

### Database verification

```bash
npx prisma migrate status
```

The project was also exercised through the browser and Postman during development.

---

# Assessment Alignment

RateIQ implements the core workflow described in the Roxiler FullStack Intern Coding Challenge:

| Challenge Area | RateIQ Implementation |
|---|---|
| Backend framework | Express.js + TypeScript |
| Database | PostgreSQL + Prisma |
| Frontend | React + TypeScript |
| Single login | Shared authentication flow |
| System Administrator | Control Center and management workflows |
| Normal User | Registration, store discovery, ratings, account management |
| Store Owner | Owner dashboard, rating visibility, analytics |
| Rating range | 1–5 |
| User/store management | Implemented |
| Search & filtering | Implemented |
| Password updates | Implemented |
| Logout | Implemented |
| Validation | Implemented for required account operations |
| Ascending/descending sorting | Implemented in tabular views |
| Relational database design | Implemented with constraints and indexes |

The store-rating workflow is extended with reputation analytics and monitoring features without replacing the required assessment functionality.

---

# What Makes RateIQ Different

The project intentionally stays close to the assessment while adding a focused product layer.

Instead of stopping at:

```text
Store → Average Rating
```

RateIQ provides:

```text
Store
  ├── Rating
  ├── Rating Count
  ├── Rating Confidence
  ├── Rating Distribution
  ├── Rating Trend
  ├── Store Health
  ├── Activity Anomaly Signal
  └── Explainable Insight
```

This makes the rating data more useful without pretending that the system is an AI or fraud-detection authority.

---

# Design Principles

RateIQ was built around a few practical principles:

### Keep the core workflow simple

The required store-rating flow remains easy to understand for users, owners, and administrators.

### Make analytics explainable

Scores and signals are derived from visible rating data and documented calculations.

### Validate at the boundary

User/account operations validate incoming data before persistence.

### Protect data integrity in the database

Important relationships such as one rating per user per store are enforced at the database layer.

### Prefer useful signals over unnecessary complexity

The intelligence layer is intentionally deterministic and lightweight so it remains understandable and maintainable.

---

# Documentation

Technical documentation is available in `docs/`:

```text
docs/
├── architecture.md
├── intelligence.md
└── algorithms/
    ├── anomaly-detection.md
    ├── health-score.md
    ├── rating-confidence.md
    └── rating-trend.md
```

These documents explain the main calculations and design choices used by RateIQ.

---

## Author

**Yogini**  
Full-stack implementation of the **Roxiler FullStack Intern Coding Challenge**.

**RateIQ — Intelligent Store Rating & Reputation Platform**