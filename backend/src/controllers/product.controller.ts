// ─────────────────────────────────────────────────────────────────────────────
// Product controller — public + admin endpoints
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import * as productService from '../services/product.service';
import * as importService from '../services/import.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export async function listProducts(req: Request, res: Response): Promise<void> {
  const { products, pagination } = await productService.listProducts(req.query as never);
  sendPaginated(res, products, pagination);
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.getProductBySlug(req.params.slug);
  sendSuccess(res, product);
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export async function adminListProducts(req: Request, res: Response): Promise<void> {
  // Admin sees all products (including inactive)
  const query = { ...req.query, active: 'all' } as never;
  const { products, pagination } = await productService.listProducts(query);
  sendPaginated(res, products, pagination);
}

export async function adminGetProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.getProductById(req.params.id);
  sendSuccess(res, product);
}

export async function adminCreateProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.createProduct(req.body);
  sendCreated(res, product, 'Product created successfully');
}

export async function adminUpdateProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.updateProduct(req.params.id, req.body);
  sendSuccess(res, product, 'Product updated successfully');
}

export async function adminDeleteProduct(req: Request, res: Response): Promise<void> {
  await productService.deleteProduct(req.params.id);
  sendNoContent(res);
}

// ── IMAGES ────────────────────────────────────────────────────────────────────

export async function adminUploadProductImages(req: Request, res: Response): Promise<void> {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw AppError.badRequest('At least one image file is required');
  }

  const { productId } = req.params;
  const images = await Promise.all(
    files.map((file, index) => {
      const imageUrl = `/uploads/images/${file.filename}`;
      const altText = req.body[`altText_${index}`] as string | undefined;
      const sortOrder = index;
      return productService.addProductImage(productId, imageUrl, altText, sortOrder);
    }),
  );

  sendCreated(res, images, 'Images uploaded successfully');
}

export async function adminDeleteProductImage(req: Request, res: Response): Promise<void> {
  await productService.deleteProductImage(req.params.imageId);
  sendNoContent(res);
}

// ── CSV/EXCEL IMPORT ──────────────────────────────────────────────────────────

export async function adminImportProducts(req: Request, res: Response): Promise<void> {
  const file = req.file as Express.Multer.File | undefined;
  if (!file || !file.buffer) {
    throw AppError.badRequest('An import file (CSV or Excel) is required');
  }

  const report = await importService.importProductsFromBuffer(file.buffer, file.mimetype);

  const statusCode = report.failed > 0 && report.successful === 0 ? 422 : 200;
  res.status(statusCode).json({
    success: report.failed === 0 || report.successful > 0,
    message: `Import complete: ${report.successful} succeeded, ${report.failed} failed`,
    data: report,
  });
}
