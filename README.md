# Neha Crockery House

**Premium Glassware & Crockery Wholesaler — Park Town, Chennai**

Full-stack B2B catalogue and enquiry management system.

---

## Project Structure

```
/neha-crockery-house
├── frontend/       Customer-facing website (HTML + CSS + Vanilla JS)
├── admin/          Internal staff admin dashboard (HTML + CSS + Vanilla JS)
├── backend/        REST API server (Node.js + TypeScript + Express + PostgreSQL)
├── docs/           Architecture and integration documentation
└── README.md
```

---

## Applications

| App | Tech Stack | Port | Purpose |
|-----|-----------|------|---------|
| Frontend | HTML/CSS/JS (Vite) | 3000 | Customer-facing website |
| Admin | HTML/CSS/JS | 3000/admin | Staff management dashboard |
| Backend | Node.js + TypeScript + Express | 4000 | REST API + Database |

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend API runs at: `http://localhost:4000/api/v1`

### 2. Start the Frontend

```bash
# From project root
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Architecture

```
Customer Browser
      │
      ▼
/frontend  (static HTML/CSS/JS)
      │ fetch()
      ▼
/backend REST API (/api/v1/*)
      │ Prisma ORM
      ▼
PostgreSQL Database
      ▲
      │ Prisma ORM
/admin REST API (/api/v1/admin/*)
      │
      ▲
Admin Browser
```

---

## Documentation

- [Backend README](./backend/README.md) — Full API documentation
- [API Endpoints](./docs/api-endpoints.md) — Complete endpoint reference
