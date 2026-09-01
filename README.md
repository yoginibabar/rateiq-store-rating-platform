# RateIQ

**From Ratings to Real Insights.**

RateIQ is a role-based store rating and reputation platform built for the Roxiler full-stack assessment. Customers discover and rate stores, owners understand reputation performance, and administrators manage and monitor the platform.

## What is included

- Customer, Owner and Admin workspaces
- JWT authentication, bcrypt hashing and RBAC
- Store Explorer with search, rating/health filters and smart sorting
- One rating per user/store with update support
- Store details, distribution, Rating Confidence, Store Health and Rating Trend
- Owner dashboard, ratings, analytics and explainable insights
- Admin user/store/rating management
- Risk Center for unusual rating activity
- Audit logs and notifications
- CSV reports
- Responsive SaaS UI, dark mode and Ctrl/Cmd+K command palette
- PostgreSQL + Prisma, Helmet, CORS and rate limiting
- Vitest intelligence tests, Postman collection, Docker and GitHub Actions

## Local setup

1. Create a PostgreSQL database named `rateiq`.
2. In `backend`, copy `.env.example` to `.env`, install packages and run `npx prisma generate`.
3. If this is a fresh database, run `npx prisma migrate dev` and `npm run seed`. If you are using the existing assessment database, **do not reset it**; `npx prisma db pull` followed by `npx prisma generate` is the safe path.
4. Start backend: `npm run dev`.
5. In `frontend`, run `npm install` then `npm run dev`.
6. Open `http://localhost:5173`.

## Demo accounts

- Admin: `admin@rateiq.com` / `Admin@12345`
- Owner: `owner1@rateiq.com` / `Owner@12345`
- Customer: `user1@rateiq.com` / `User@12345`

## RateIQ intelligence

Health = 35% Rating Quality + 25% Confidence + 20% Trend + 10% Stability + 10% Engagement. Confidence grows with rating volume. Trend compares recent and previous 30-day periods. Anomaly detection flags unusual activity; it does not claim to prove fake reviews. See `docs/algorithms/`.
