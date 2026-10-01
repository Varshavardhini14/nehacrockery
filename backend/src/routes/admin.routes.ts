// ─────────────────────────────────────────────────────────────────────────────
// Admin routes: /api/v1/admin
// All routes protected by authentication + role authorization
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadImages, uploadCatalogue, uploadImport } from '../middleware/upload';
import * as productController from '../controllers/product.controller';
import * as categoryController from '../controllers/category.controller';
import * as enquiryController from '../controllers/enquiry.controller';
import * as siteController from '../controllers/site.controller';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator';
import {
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
} from '../validators/catalogue.validator';
import { updateEnquiryStatusSchema } from '../validators/enquiry.validator';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticate);

// ── Product management ────────────────────────────────────────────────────────
router
  .route('/products')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), productController.adminListProducts)
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createProductSchema),
    productController.adminCreateProduct,
  );

// CSV/Excel import — must come before /:id routes
router.post(
  '/products/import',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadImport.single('file'),
  productController.adminImportProducts,
);

router
  .route('/products/:id')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), productController.adminGetProduct)
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateProductSchema),
    productController.adminUpdateProduct,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), productController.adminDeleteProduct);

// Product images
router.post(
  '/products/:productId/images',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadImages.array('images', 10),
  productController.adminUploadProductImages,
);

router.delete(
  '/products/:productId/images/:imageId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  productController.adminDeleteProductImage,
);

// ── Category management ───────────────────────────────────────────────────────
router
  .route('/categories')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), categoryController.adminListCategories)
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createCategorySchema),
    categoryController.adminCreateCategory,
  );

router
  .route('/categories/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateCategorySchema),
    categoryController.adminUpdateCategory,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), categoryController.adminDeleteCategory);

// ── Brand management ──────────────────────────────────────────────────────────
router
  .route('/brands')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), categoryController.adminListBrands)
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createBrandSchema),
    categoryController.adminCreateBrand,
  );

router
  .route('/brands/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateBrandSchema),
    categoryController.adminUpdateBrand,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), categoryController.adminDeleteBrand);

// ── Enquiry management ────────────────────────────────────────────────────────
router
  .route('/enquiries')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), enquiryController.adminListEnquiries);

router
  .route('/enquiries/:id')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), enquiryController.adminGetEnquiry)
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateEnquiryStatusSchema),
    enquiryController.adminUpdateEnquiryStatus,
  );

// ── Banner management ─────────────────────────────────────────────────────────
router
  .route('/banners')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), siteController.adminListBanners)
  .post(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminCreateBanner);

router
  .route('/banners/:id')
  .put(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminUpdateBanner)
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminDeleteBanner);

// ── Review management ─────────────────────────────────────────────────────────
router
  .route('/reviews')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), siteController.adminListReviews)
  .post(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminCreateReview);

router
  .route('/reviews/:id')
  .put(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminUpdateReview)
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminDeleteReview);

// ── Catalogue management ──────────────────────────────────────────────────────
router
  .route('/catalogues')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), siteController.adminListCatalogues)
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    uploadCatalogue.single('file'),
    siteController.adminCreateCatalogue,
  );

router
  .route('/catalogues/:id')
  .put(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminUpdateCatalogue)
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminDeleteCatalogue);

// ── Site settings ─────────────────────────────────────────────────────────────
router
  .route('/settings')
  .get(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF), siteController.getSiteSettings)
  .put(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminUpdateSettings);

export default router;
