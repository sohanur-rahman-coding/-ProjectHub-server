# ProjectHub — Backend API Server

> Full-stack REST API server for project submission, duplicate validation, and mentor review evaluation built with Express.js, TypeScript, PostgreSQL, and Prisma ORM.

---

## 🎯 Architecture & Capabilities

- **MVC Architecture:** Structured into controllers, routes, middleware, schemas, and config.
- **Prisma ORM & PostgreSQL:** Relational schema supporting Users, Roles (`STUDENT`, `MENTOR`, `ADMIN`), and Project Submissions with status lifecycles (`PENDING`, `APPROVED`, `REJECTED`).
- **Duplicate Collision Protection:** Database constraints and query verification prevent duplicate repository URLs and identical project titles per student (returns HTTP 409 Conflict).
- **Anti-Spam Rate Limiting:** Window-based Express rate limiter throttling excessive submissions per IP address.
- **JWT-Based RBAC:** Secure token signing with role-based route guards (`requireRole`).

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js:** v18.0.0+ or v20.0.0+
- **npm:** v9.0.0+
- PostgreSQL database (e.g. Neon Cloud PostgreSQL or local PG)

### 2. Installation
```bash
# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the server root:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET=super_secret_jwt_key_project_review_2026_change_in_production
JWT_EXPIRES_IN=7d
DATABASE_URL="your_postgresql_connection_string"
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to PostgreSQL
npm run prisma:push

# Seed default accounts (Admin, Mentor, Student) and realistic sample submissions
npm run prisma:seed
```

### 5. Running the Server
```bash
nodemon index.js
```
*(or run `npm run dev`)*

The server will start on **`http://localhost:5000`**.

---

## 🔑 Default Accounts (Seeded)

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Password@123` | Full administrative oversight, review dashboard, user management |
| **Mentor** | `mentor@example.com` | `Password@123` | Review dashboard, evaluation decisions, rubric feedback |
| **Student** | `student@example.com` | `Password@123` | Project submissions, resubmissions, personal dashboard |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user; returns signed JWT and profile |
| `POST` | `/api/auth/register` | Public | Registers a new student or mentor account |
| `POST` | `/api/auth/google` | Public | Google OAuth credential sign-in and account creation |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current logged-in user profile |

### Student Submissions (`/api/submissions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/submissions` | `STUDENT`, `ADMIN` | Submit project (enforces duplicate repo shield & rate limiting) |
| `GET` | `/api/submissions/my` | `STUDENT`, `ADMIN` | List all submissions by authenticated student |
| `PUT` | `/api/submissions/:id` | `STUDENT`, `ADMIN` | Update submission deliverables (resets status to `PENDING`) |

### Mentor Evaluation (`/api/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/stats` | `MENTOR`, `ADMIN` | Aggregated metrics (Total, Pending, Approved, Rejected, Rate) |
| `GET` | `/api/reviews/submissions` | `MENTOR`, `ADMIN` | Paginated submissions with search & status filters |
| `PATCH` | `/api/reviews/submissions/:id` | `MENTOR`, `ADMIN` | Record review decision (`APPROVED`, `REJECTED`, `PENDING`) and notes |

---

## 📂 Project Structure

```text
ProjectHub-server/
├── index.js                  # Server entry point (runs with nodemon index.js)
├── nodemon.json              # Nodemon configuration
├── prisma/
│   ├── schema.prisma         # Database schema (User, ProjectSubmission, Enums)
│   └── seed.ts               # Database seeder with sample accounts & projects
├── src/
│   ├── app.ts                # Express setup, CORS, rate limiter, routing
│   ├── server.ts             # Server entry point with DB health check
│   ├── config/               # Prisma singleton and env config
│   ├── controllers/          # Auth, submission, and review business logic
│   ├── middleware/           # JWT auth, role RBAC, validation, rate limiting
│   ├── routes/               # Express route declarations
│   ├── schemas/              # Zod validation schemas
│   └── types/                # TypeScript interfaces
├── .env                      # Server environment configuration
├── package.json
└── tsconfig.json
```
