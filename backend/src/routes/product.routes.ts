// ─────────────────────────────────────────────────────────────────────────────
// Public product routes: /api/v1/products
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as productController from '../controllers/product.controller';

const router = Router();

// GET /api/v1/products?page=1&pageSize=20&search=...&category=...&brand=...
router.get('/', productController.listProducts);

// GET /api/v1/products/:slug
router.get('/:slug', productController.getProduct);

export default router;
