# Neha Crockery House — Backend API

Production-ready REST API backend for the Neha Crockery House catalogue management system.

Built with **Node.js · TypeScript · Express.js · PostgreSQL · Prisma ORM**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Development](#development)
7. [Production Build](#production-build)
8. [API Structure](#api-structure)
9. [Authentication](#authentication)
10. [Product Management](#product-management)
11. [CSV / Excel Import](#csv--excel-import)
12. [File & Image Storage](#file--image-storage)
13. [Testing](#testing)
14. [Database Commands Reference](#database-commands-reference)

---

## Architecture Overview

```
/backend
├── src/
│   ├── config/          # env.ts (validated config), database.ts (Prisma singleton)
│   ├── controllers/     # Thin HTTP handlers — delegate to services
│   ├── middleware/       # auth, validate, upload, errorHandler
│   ├── routes/          # Route definitions (index.ts, auth, product, admin)
│   ├── services/        # Business logic (product, category, auth, enquiry, site, import)
│   ├── utils/           # AppError, logger, apiResponse, pagination, slugify
│   ├── validators/      # Zod schemas
│   ├── app.ts           # Express app (middleware stack)
│   └── server.ts        # HTTP server + graceful shutdown
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Initial data seed
├── tests/               # Integration tests (supertest + Jest)
├── uploads/             # Local file storage (not in git)
├── .env.example         # Environment variable template
└── README.md
```

**Design Principle:** Routes → Controllers → Services → Prisma

- Routes: only register middleware + controller
- Controllers: parse request, call service, send response
- Services: all business logic + database queries

---

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+

---

## Installation

```bash
# From the project root
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Supabase pooled connection (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | ✅ | Supabase direct connection (port 5432) — for migrations only |
| `JWT_SECRET` | ✅ | Minimum 64-char random secret |
| `JWT_EXPIRES_IN` | | Token lifetime (default: `7d`) |
| `JWT_COOKIE_EXPIRES_DAYS` | | Cookie lifetime (default: `7`) |
| `PORT` | | Server port (default: `4000`) |
| `NODE_ENV` | | `development` / `production` |
| `ADMIN_EMAIL` | | Seed admin email |
| `ADMIN_PASSWORD` | | Seed admin password |
| `CORS_ORIGINS` | | Comma-separated allowed origins |
| `SUPABASE_URL` | | Supabase project URL (optional) |
| `SUPABASE_ANON_KEY` | | Supabase anon key (optional) |
| `STORAGE_STRATEGY` | | `local` / `cloudinary` / `s3` |

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup (Supabase)

This backend uses **Supabase** as the hosted PostgreSQL provider.

### Why two connection URLs?

Supabase routes app traffic through **PgBouncer** (a connection pooler) for efficiency.
Prisma migrations need a **direct** connection that bypasses the pooler.

| Variable | Port | Purpose |
|----------|------|---------|
| `DATABASE_URL` | **6543** | App queries — via PgBouncer (`?pgbouncer=true`) |
| `DIRECT_URL` | **5432** | Prisma migrations only — bypasses pooler |

### 1. Get your connection strings

1. Open [Supabase Dashboard](https://app.supabase.com) → select your project
2. Go to **Settings → Database → Connection string**
3. Switch to the **"URI"** tab
4. Copy **"Transaction"** mode URL → paste as `DATABASE_URL` (change port to `6543`, add `?pgbouncer=true&connection_limit=1`)
5. Copy **"Session"** mode URL → paste as `DIRECT_URL` (port `5432`)

```
# .env example for Supabase (ap-south-1 region)
DATABASE_URL="postgresql://postgres.abcxyz:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.abcxyz:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

> The region in the hostname (`aws-0-ap-south-1`) depends on where your Supabase project is hosted. Copy it exactly from the dashboard.

### 2. Generate Prisma client

```bash
npm run prisma:generate
```

### 3. Run migrations

Prisma uses `DIRECT_URL` automatically for this command:

```bash
npm run prisma:migrate
# → Enter a migration name when prompted, e.g.: "init"
```

For production deployments (CI/CD, no prompts):

```bash
npm run prisma:migrate:deploy
```

### 4. Seed initial data

```bash
npm run prisma:seed
```

Creates:
- One **SUPER_ADMIN** user (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`)
- All **9 product categories**
- **Taroba** brand
- Empty **site settings** record

---

## Development

```bash
npm run dev
```

Server starts on `http://localhost:4000` with hot reload via `ts-node-dev`.

---

## Production Build

```bash
npm run build
npm start
```

---

## API Structure

All endpoints are versioned under `/api/v1`.

### Health Check

```
GET /api/v1/health
```

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products (paginated + filtered) |
| GET | `/api/v1/products/:slug` | Get product by slug |
| GET | `/api/v1/categories` | List active categories |
| GET | `/api/v1/categories/:slug` | Get category by slug |
| GET | `/api/v1/brands` | List active brands |
| GET | `/api/v1/brands/:slug` | Get brand by slug |
| GET | `/api/v1/banners` | List active banners |
| GET | `/api/v1/reviews` | List published reviews |
| GET | `/api/v1/site-settings` | Get site configuration |
| GET | `/api/v1/catalogues` | List active catalogues |
| POST | `/api/v1/enquiries` | Submit an enquiry |
| POST | `/api/v1/catalogue-requests` | Request a catalogue |

#### Product Query Parameters

```
GET /api/v1/products?page=1&pageSize=20&search=dinner+set&category=crockery-dinnerware&brand=taroba&featured=true&newArrival=false&sortBy=name&sortOrder=asc
```

| Parameter | Values | Description |
|-----------|--------|-------------|
| `page` | integer | Page number (default: 1) |
| `pageSize` | 1–100 | Results per page (default: 20) |
| `search` | string | Full-text search on name/description/code/material |
| `category` | slug or id | Filter by category |
| `brand` | slug or id | Filter by brand |
| `featured` | `true`/`false` | Featured products only |
| `newArrival` | `true`/`false` | New arrivals only |
| `sortBy` | `name`/`createdAt`/`mrp`/`productCode` | Sort field |
| `sortOrder` | `asc`/`desc` | Sort direction |

---

## Authentication

Authentication uses JWT stored in secure HTTP-only cookies.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@nehacrockery.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt-token>",
    "user": {
      "id": "...",
      "name": "Admin",
      "email": "admin@nehacrockery.com",
      "role": "SUPER_ADMIN"
    }
  }
}
```

The `nch_token` cookie is set automatically.

### Subsequent requests

Option 1 — Cookie (browser-based admin dashboard):
```
Cookie: nch_token=<jwt>
```

Option 2 — Bearer token (API clients):
```
Authorization: Bearer <jwt>
```

### Roles

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full access |
| `ADMIN` | Full access except user management |
| `STAFF` | Read-only access to admin panel |

---

## Product Management

### Create Product

```http
POST /api/v1/admin/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Bone China Dinner Set",
  "productCode": "NCH-D-001",
  "description": "Elegant 12-piece dinner set...",
  "categoryId": "<category-cuid>",
  "brandId": "<brand-cuid>",
  "material": "Bone China",
  "capacity": null,
  "dimensions": "Dinner plate: 27cm",
  "setContents": "4 dinner plates, 4 side plates, 4 bowls",
  "piecesPerSet": 12,
  "mrp": 2499,
  "isFeatured": true,
  "isNewArrival": false,
  "isActive": true,
  "features": ["Dishwasher safe", "Microwave safe", "Lead-free glaze"],
  "seoTitle": "Buy Bone China Dinner Set — Neha Crockery",
  "seoDescription": "Premium 12-piece bone china dinner set..."
}
```

### Upload Product Images

```http
POST /api/v1/admin/products/:productId/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

images: <file1>
images: <file2>
altText_0: "Product front view"
altText_1: "Product side view"
```

---

## CSV / Excel Import

```http
POST /api/v1/admin/products/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <products.csv>
```

### Expected CSV Columns

| Column | Required | Description |
|--------|----------|-------------|
| `productName` | ✅ | Product name |
| `productCode` | | Unique product code |
| `brand` | | Brand name or slug |
| `category` | | Category name or slug |
| `description` | | Product description |
| `material` | | Material type |
| `capacity` | | Capacity info |
| `dimensions` | | Dimensions string |
| `setContents` | | Set contents description |
| `piecesPerSet` | | Number of pieces |
| `packagingInformation` | | Packaging details |
| `features` | | Pipe/comma-separated list |
| `mrp` | | Maximum retail price |
| `isFeatured` | | `true`/`false` |
| `isNewArrival` | | `true`/`false` |

### Import Response

```json
{
  "success": true,
  "message": "Import complete: 48 succeeded, 2 failed",
  "data": {
    "total": 50,
    "successful": 48,
    "failed": 2,
    "skipped": 0,
    "rows": [
      { "row": 2, "productName": "Dinner Set A", "status": "success" },
      { "row": 15, "productName": "", "status": "error", "errors": ["productName is required"] },
      { "row": 32, "productName": "Tea Set B", "status": "error", "errors": ["Category \"SpecialWare\" not found"] }
    ]
  }
}
```

> If ALL rows fail, the transaction is rolled back and nothing is inserted.

---

## File & Image Storage

Currently uses **local disk storage** (`uploads/images/` and `uploads/catalogues/`).

Files are served statically at `/uploads/...`.

### Switching to Cloudinary or S3

The `src/middleware/upload.ts` file uses a storage abstraction. To switch:

1. Install the appropriate multer storage adapter:
   - `multer-storage-cloudinary` for Cloudinary
   - `multer-s3` for AWS S3
2. Replace the `imageStorage` and `catalogueStorage` in `upload.ts`
3. Set `STORAGE_STRATEGY=cloudinary` or `STORAGE_STRATEGY=s3` in `.env`
4. Add the cloud credentials to `.env`

Product image URLs are stored in PostgreSQL — only the URL changes, not the data model.

---

## Testing

Tests are integration tests that run against a **real PostgreSQL test database**.

### Setup test database

```bash
# Create test DB
createdb neha_crockery_test

# Apply migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neha_crockery_test?schema=public" npx prisma migrate deploy
```

### Run tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

### Test coverage areas

- ✅ Authentication (login, token validation, logout)
- ✅ Admin authorization (unauthenticated + invalid token)
- ✅ Product creation (validation, success, duplicate code)
- ✅ Product listing (pagination, filtering, search)
- ✅ Product by slug (success, 404)
- ✅ Product update (fields, 404)
- ✅ Product delete (success, 404)
- ✅ Enquiry creation (validation, success)
- ✅ Catalogue request creation

---

## Database Commands Reference

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create a new migration (development)
npm run prisma:migrate

# Apply migrations to production database
npm run prisma:migrate:deploy

# Open Prisma Studio (visual DB browser)
npm run prisma:studio

# Run seed script
npm run prisma:seed

# Reset database (⚠️ DESTROYS ALL DATA — dev only)
npx prisma migrate reset
```

---

## Integration with Frontend & Admin

The frontend (`/frontend`) and admin (`/admin`) connect to this API:

```
Frontend → GET /api/v1/products (public)
Admin    → POST /api/v1/auth/login → GET /api/v1/admin/products (protected)
```

Update the `data-api-url` attribute in `/admin/index.html` to point to the backend:

```html
<div class="admin-dashboard" data-api-url="http://localhost:4000/api/v1" ...>
```

And update the frontend fetch calls in `/frontend/scripts/main.js` to call
`http://localhost:4000/api/v1/products` instead of loading local JSON files.
