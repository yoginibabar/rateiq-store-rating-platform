# RateIQ — Intelligent Store Rating & Reputation Platform

**From Ratings to Real Insights.**

RateIQ is a full-stack store rating and reputation management platform built for managing stores, customer ratings, role-based workflows, and rating intelligence in one application.

The project was developed as a full-stack implementation of the Roxiler FullStack Intern Coding Challenge, with additional analytics and reputation features built around the core rating workflow.

---

## Overview

RateIQ connects three types of users:

- **System Administrator** — manages users, stores, ratings, platform activity, risks, audits, and reports.
- **Normal User** — discovers stores, searches stores, submits ratings, and updates previously submitted ratings.
- **Store Owner** — monitors store ratings, customer feedback, rating trends, and store performance.

Beyond the required assessment functionality, RateIQ adds an intelligence layer to help interpret rating data instead of treating ratings as simple numbers.

---

## Key Features

### Authentication & Authorization

- Single login system for all application roles
- JWT-based authentication
- Secure password hashing using bcrypt
- Role-based access control
- Protected API routes
- Role-specific dashboards and navigation
- Logout functionality
- Password update functionality

### System Administrator

- Dashboard with:
  - Total users
  - Total stores
  - Total ratings
  - Average platform rating
- Create normal users and administrators
- Create and manage store owners
- Search and filter users
- Search and filter stores
- Sort tabular data in ascending/descending order
- View user details
- Display owner rating information
- Store management
- Rating management
- Risk monitoring
- Audit log monitoring
- User/store/rating reporting
- CSV-compatible report endpoints

### Normal User

- Sign up and log in
- View all registered stores
- Search stores by name and address
- Sort store results
- View overall store rating
- View personal submitted rating
- Submit a rating from 1 to 5
- Update a previously submitted rating
- View personal rating history
- Change password
- Log out

### Store Owner

- Log in securely
- View owned store information
- View average store rating
- View rating count
- View users who submitted ratings
- View rating distribution
- Review rating trends
- Monitor store performance
- Change password
- Log out

---

## RateIQ Intelligence

RateIQ adds an analytics layer around the required store-rating workflow.

### Rating Confidence

Provides a confidence indicator for store ratings based on available rating evidence and volume.

### Store Health

Combines rating-related signals into a higher-level view of store performance.

### Rating Trends

Analyzes rating activity over time to identify whether a store's reputation is improving, stable, or declining.

### Activity Anomalies

Highlights unusual rating activity patterns that may require review.

### Smart Ranking

Provides a more balanced ranking approach than simply comparing raw average ratings, reducing the impact of very small rating samples.

### Explainable Insights

Converts rating and activity data into readable insights so users can understand what the numbers indicate.

---

## Notifications

RateIQ includes a notification center with:

- User notifications
- Read/unread state
- Backend notification support

---

## Audit & Risk Monitoring

### Audit Logs

Important administrative and system actions can be recorded for traceability.

### Risk Center

Rating activity can be analyzed for unusual patterns and potential risk signals.

---

## Reporting

RateIQ provides reporting endpoints for:

- Users
- Stores
- Ratings

Reports are designed for CSV-compatible export and further analysis.

---

## Validation Rules

The application enforces the assessment validation requirements on the relevant forms:

| Field | Rule |
|---|---|
| Name | 20–60 characters |
| Address | Maximum 400 characters |
| Password | 8–16 characters |
| Password | At least one uppercase letter |
| Password | At least one special character |
| Email | Standard email format |
| Rating | Integer value from 1 to 5 |

Validation is handled on the client side and reinforced on the backend.

---

## Rating Rules

Each user can maintain one rating per store.

A submitted rating can later be updated by the same user.

This is enforced at the database level with a unique user/store relationship.

---

## Sorting & Search

The application supports sorting for key tabular data using ascending and descending order.

Search and filtering are available for major administration and store-discovery workflows.

Examples include:

- User name
- Email
- Address
- Role
- Store information
- Rating-related fields

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- React Hook Form
- Zod
- Recharts

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- JSON Web Tokens (JWT)
- bcrypt
- Helmet
- CORS
- Express Rate Limit

### Database

- PostgreSQL

### Development & Delivery

- Git
- GitHub
- GitHub Actions
- Docker

---

## Architecture

```text
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