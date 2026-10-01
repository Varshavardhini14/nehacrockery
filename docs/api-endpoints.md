# API Endpoints Reference

Base URL: `http://localhost:4000/api/v1`

---

## Public Endpoints

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |

### Products
| Method | Path | Query Params | Description |
|--------|------|-------------|-------------|
| GET | `/products` | page, pageSize, search, category, brand, featured, newArrival, sortBy, sortOrder | List products |
| GET | `/products/:slug` | | Get product by slug |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | List active categories |
| GET | `/categories/:slug` | Get category by slug (includes children) |

### Brands
| Method | Path | Description |
|--------|------|-------------|
| GET | `/brands` | List active brands |
| GET | `/brands/:slug` | Get brand by slug |

### Site Data
| Method | Path | Description |
|--------|------|-------------|
| GET | `/banners` | List active banners |
| GET | `/reviews` | List published reviews |
| GET | `/site-settings` | Get business information |
| GET | `/catalogues` | List active catalogue PDFs |

### Forms (No auth required)
| Method | Path | Body Fields | Description |
|--------|------|-------------|-------------|
| POST | `/enquiries` | name, phone, email?, companyName?, customerType, message?, productId?, quantity? | Submit enquiry |
| POST | `/catalogue-requests` | name, phone, email?, companyName?, customerType | Request catalogue |

---

## Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login → sets httpOnly cookie + returns token |
| POST | `/auth/logout` | Clear auth cookie |
| GET | `/auth/me` | Get current user profile |

---

## Admin Endpoints (Authentication Required)

### Products
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/products` | ALL | List all products (incl. inactive) |
| POST | `/admin/products` | ADMIN+ | Create product |
| GET | `/admin/products/:id` | ALL | Get product by ID |
| PUT | `/admin/products/:id` | ADMIN+ | Update product |
| DELETE | `/admin/products/:id` | ADMIN+ | Delete product |
| POST | `/admin/products/:id/images` | ADMIN+ | Upload product images |
| DELETE | `/admin/products/:id/images/:imageId` | ADMIN+ | Delete a product image |
| POST | `/admin/products/import` | ADMIN+ | Bulk import from CSV/Excel |

### Categories
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/categories` | ALL | List all categories |
| POST | `/admin/categories` | ADMIN+ | Create category |
| PUT | `/admin/categories/:id` | ADMIN+ | Update category |
| DELETE | `/admin/categories/:id` | ADMIN+ | Delete category (fails if products exist) |

### Brands
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/brands` | ALL | List all brands |
| POST | `/admin/brands` | ADMIN+ | Create brand |
| PUT | `/admin/brands/:id` | ADMIN+ | Update brand |
| DELETE | `/admin/brands/:id` | ADMIN+ | Delete brand (fails if products exist) |

### Enquiries
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/enquiries` | ALL | List enquiries (filter by ?status=NEW) |
| GET | `/admin/enquiries/:id` | ALL | Get enquiry details |
| PUT | `/admin/enquiries/:id` | ADMIN+ | Update enquiry status |

### Banners
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/banners` | ALL | List all banners |
| POST | `/admin/banners` | ADMIN+ | Create banner |
| PUT | `/admin/banners/:id` | ADMIN+ | Update banner |
| DELETE | `/admin/banners/:id` | ADMIN+ | Delete banner |

### Reviews
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/reviews` | ALL | List all reviews |
| POST | `/admin/reviews` | ADMIN+ | Create review |
| PUT | `/admin/reviews/:id` | ADMIN+ | Update / publish review |
| DELETE | `/admin/reviews/:id` | ADMIN+ | Delete review |

### Catalogues
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/catalogues` | ALL | List all catalogues |
| POST | `/admin/catalogues` | ADMIN+ | Upload catalogue PDF |
| PUT | `/admin/catalogues/:id` | ADMIN+ | Update catalogue metadata |
| DELETE | `/admin/catalogues/:id` | ADMIN+ | Delete catalogue |

### Settings
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/settings` | ALL | Get site settings |
| PUT | `/admin/settings` | ADMIN+ | Update site settings |

---

## Response Shapes

### Success
```json
{ "success": true, "message": "OK", "data": { ... } }
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "pageSize": 20, "total": 75, "totalPages": 4 }
}
```

### Error
```json
{ "success": false, "message": "Error description", "code": "ERROR_CODE" }
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "phone", "message": "Invalid phone number format" }]
}
```

---

## Role Reference

| Role | Abbreviation in table |
|------|-----------------------|
| SUPER_ADMIN, ADMIN, STAFF | ALL |
| SUPER_ADMIN, ADMIN | ADMIN+ |
| SUPER_ADMIN only | SUPER_ADMIN |
