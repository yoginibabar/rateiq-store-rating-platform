RateIQ — Intelligent Store Rating & Reputation Platform

From Ratings to Real Insights.

RateIQ is a full-stack store rating and reputation management platform built for managing stores, customer ratings, role-based workflows, and rating intelligence in one application.

The project was developed as a full-stack implementation of the Roxiler FullStack Intern Coding Challenge, with additional analytics and reputation features built around the core rating workflow.

Overview

RateIQ connects three types of users:

System Administrator — manages users, stores, ratings, platform activity, risks, audits, and reports.

Normal User — discovers stores, searches stores, submits ratings, and updates previously submitted ratings.

Store Owner — monitors store ratings, customer feedback, rating trends, and store performance.

Beyond the required assessment functionality, RateIQ adds an intelligence layer to help interpret rating data instead of treating ratings as simple numbers.

Key Features

Authentication & Authorization

Single login system for all application roles

JWT-based authentication

Secure password hashing using bcrypt

Role-based access control

Protected API routes

Role-specific dashboards and navigation

Logout functionality

Password update functionality

System Administrator

Dashboard with:

Total users

Total stores

Total ratings

Average platform rating

Create normal users and administrators

Create and manage store owners

Search and filter users

Search and filter stores

Sort tabular data in ascending/descending order

View user details

Display owner rating information

Store management

Rating management

Risk monitoring

Audit log monitoring

User/store/rating reporting

CSV-compatible report endpoints

Normal User

Sign up and log in

View all registered stores

Search stores by name and address

Sort store results

View overall store rating

View personal submitted rating

Submit a rating from 1 to 5

Update a previously submitted rating

View personal rating history

Change password

Log out

Store Owner

Log in securely

View owned store information

View average store rating

View rating count

View users who submitted ratings

View rating distribution

Review rating trends

Monitor store performance

Change password

Log out

RateIQ Intelligence

RateIQ adds an analytics layer around the required store-rating workflow.

Rating Confidence

Provides a confidence indicator for store ratings based on available rating evidence and volume.

Store Health

Combines rating-related signals into a higher-level view of store performance.

Rating Trends

Analyzes rating activity over time to identify whether a store's reputation is improving, stable, or declining.

Activity Anomalies

Highlights unusual rating activity patterns that may require review.

Smart Ranking

Provides a more balanced ranking approach than simply comparing raw average ratings, reducing the impact of very small rating samples.

Explainable Insights

Converts rating and activity data into readable insights so users can understand what the numbers indicate.

Notifications

RateIQ includes a notification center with:

User notifications

Read/unread state

Backend notification support

Audit & Risk Monitoring

Audit Logs

Important administrative and system actions can be recorded for traceability.

Risk Center

Rating activity can be analyzed for unusual patterns and potential risk signals.

Reporting

RateIQ provides reporting endpoints for:

Users

Stores

Ratings

Reports are designed for CSV-compatible export and further analysis.

Productivity Features

Command Palette

A Ctrl/Cmd + K command palette provides faster navigation between major application areas.

Responsive UI

The application is designed to work across desktop and smaller screen sizes.

Dark / Light Mode

The interface supports both light and dark presentation modes.

Validation Rules

The application enforces the assessment validation requirements on the relevant forms:

Field

Rule

Name

20–60 characters

Address

Maximum 400 characters

Password

8–16 characters

Password

At least one uppercase letter

Password

At least one special character

Email

Standard email format

Rating

Integer value from 1 to 5

Validation is handled on the client side and reinforced on the backend.

Rating Rules

Each user can maintain one rating per store.

A submitted rating can later be updated by the same user.

This is enforced at the database level with a unique user/store relationship.

Sorting & Search

The application supports sorting for key tabular data using ascending and descending order.

Search and filtering are available for major administration and store-discovery workflows.

Examples include:

User name

Email

Address

Role

Store information

Rating-related fields

Technology Stack

Frontend

React

TypeScript

Vite

React Router

Tailwind CSS

Axios

React Hook Form

Zod

Recharts

Backend

Node.js

Express.js

TypeScript

Prisma ORM

JSON Web Tokens (JWT)

bcrypt

Helmet

CORS

Express Rate Limit

Database

PostgreSQL

Development & Delivery

Git

GitHub

GitHub Actions

Docker

Architecture

React + TypeScript Frontend
            |
            | REST API
            v
Express + TypeScript Backend
            |
     Authentication
       Middleware
            |
            v
        Prisma ORM
            |
            v
       PostgreSQL

The backend contains dedicated areas for:

Configuration

Prisma access

Authentication middleware

Error handling

Application/server routes

Rating intelligence utilities

Documentation for the architecture and intelligence layer is available in the docs/ directory.

Database

The relational database includes the core entities needed for the platform:

User
Store
Rating
Notification
AuditLog

Important database design decisions include:

Relational foreign-key relationships

Indexed frequently queried fields

Unique user/store rating constraint

Timestamped records

Role-based user model

Normalized relational structure

Security

RateIQ includes several security measures:

Password hashing with bcrypt

JWT authentication

Role-based authorization

Protected endpoints

Helmet security headers

CORS configuration

API rate limiting

Environment-based configuration

Frontend and backend validation

Database constraints for rating integrity

Project Structure

rateiq-store-rating-platform/
│
├── .github/
│   └── workflows/
│       └── ci.yml
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
│   ├── Dockerfile
│   ├── package.json
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
│   ├── Dockerfile
│   ├── package.json
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
├── docker-compose.yml
└── README.md

Getting Started

Prerequisites

Make sure the following are installed:

Node.js

npm

PostgreSQL

Git

1. Clone the Repository

git clone https://github.com/YOUR_USERNAME/rateiq-store-rating-platform.git
cd rateiq-store-rating-platform

2. Configure Backend Environment

Go to the backend directory:

cd backend

Create a .env file based on .env.example.

Example:

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rateiq?schema=public"
JWT_SECRET="your-development-secret"
PORT=5000
CLIENT_URL="http://localhost:5173"

Do not commit .env to GitHub.

3. Install Backend Dependencies

npm install

Generate Prisma Client:

npx prisma generate

Check database migration status:

npx prisma migrate status

Start the backend:

npm run dev

Backend:

http://localhost:5000

4. Install Frontend Dependencies

Open another terminal:

cd frontend
npm install

Start the frontend:

npm run dev

Frontend:

http://localhost:5173

5. Production Build Verification

Frontend

cd frontend
npm run build

Backend

cd backend
npx tsc --noEmit

Demo Accounts

The project includes seeded demo data for testing the main roles.

Administrator

Email: admin@rateiq.com

Store Owner

Email: owner1@rateiq.com

Normal User

Email: user1@rateiq.com

Demo passwords are defined in the backend seed configuration and should be used only for local assessment/demo environments.

Postman

A Postman collection is included at:

postman/RateIQ.postman_collection.json

The collection covers the main API workflows including:

Authentication

Users

Stores

Ratings

Administration

Owner dashboard

Notifications

Reports

Analytics

Risk-related endpoints

Import the collection into Postman and configure the required authentication token/environment values.

Docker

Docker configuration is included for easier environment setup.

docker compose up --build

The repository contains:

Backend Dockerfile

Frontend Dockerfile

Docker Compose configuration

CI

GitHub Actions configuration is available under:

.github/workflows/ci.yml

The workflow is intended to verify the project during repository changes.

Documentation

Additional technical documentation is available under docs/.

Architecture

docs/architecture.md

Intelligence Layer

docs/intelligence.md

Algorithms

docs/algorithms/
├── anomaly-detection.md
├── health-score.md
├── rating-confidence.md
└── rating-trend.md

Assessment Requirement Coverage

RateIQ covers the core requirements of the Roxiler FullStack Intern Coding Challenge.

Requirement

RateIQ

Express.js backend

✅

PostgreSQL/MySQL database

✅

React frontend

✅

Single login system

✅

System Administrator

✅

Normal User

✅

Store Owner

✅

Normal-user registration

✅

Store ratings from 1–5

✅

Admin dashboard totals

✅

Admin user management

✅

Admin store management

✅

Admin rating management

✅

User store discovery

✅

Store search by name/address

✅

Submit rating

✅

Modify rating

✅

Owner dashboard

✅

Owner average rating

✅

Owner rating submitters

✅

Password update

✅

Logout

✅

Name validation: 20–60

✅

Address validation: max 400

✅

Password validation: 8–16

✅

Uppercase password requirement

✅

Special-character requirement

✅

Email validation

✅

Ascending/descending sorting

✅

Database best practices

✅

Why I Built RateIQ

The assessment focuses on a store-rating workflow, but the project was designed to go one step further.

A rating by itself does not explain:

How reliable the rating is

Whether the store is improving

Whether recent activity looks unusual

What factors are influencing store performance

RateIQ adds an intelligence layer around the rating data to make those questions easier to answer.

From Ratings to Real Insights.

Author

Built as part of the Roxiler FullStack Intern Coding Challenge.

Project: RateIQ
Type: Full-Stack Web Application
Database: PostgreSQL
Backend: Node.js + Express + TypeScript
Frontend: React + TypeScript