// ─────────────────────────────────────────────────────────────────────────────
// Product service — all business logic for product CRUD, search, filtering
// ─────────────────────────────────────────────────────────────────────────────
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { generateUniqueSlug } from '../utils/slugify';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from '../validators/product.validator';

// ── Shared image select ───────────────────────────────────────────────────────
const imageSelect = {
  id: true,
  imageUrl: true,
  altText: true,
  sortOrder: true,
};

// ── Shared product select (public) ────────────────────────────────────────────
const productPublicSelect = {
  id: true,
  name: true,
  slug: true,
  productCode: true,
  description: true,
  material: true,
  capacity: true,
  dimensions: true,
  setContents: true,
  piecesPerSet: true,
  packagingInformation: true,
  features: true,
  mrp: true,
  isFeatured: true,
  isNewArrival: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { select: imageSelect, orderBy: { sortOrder: 'asc' as const } },
};

// ── Build WHERE clause from public query params ────────────────────────────────
function buildProductWhere(query: ProductQueryInput): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  // Active filter
  if (!query.active || query.active === 'true') {
    where.isActive = true;
  } else if (query.active === 'false') {
    where.isActive = false;
  }
  // 'all' means no filter

  // Search
  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { productCode: { contains: search, mode: 'insensitive' } },
      { material: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Category filter (by slug or id)
  if (query.category) {
    where.category = {
      OR: [{ slug: query.category }, { id: query.category }],
    };
  }

  // Brand filter (by slug or id)
  if (query.brand) {
    where.brand = {
      OR: [{ slug: query.brand }, { id: query.brand }],
    };
  }

  if (query.featured === 'true') where.isFeatured = true;
  if (query.newArrival === 'true') where.isNewArrival = true;

  return where;
}

// ── Build ORDER BY ─────────────────────────────────────────────────────────────
function buildProductOrderBy(
  sortBy: string,
  sortOrder: string,
): Prisma.ProductOrderByWithRelationInput {
  const dir = sortOrder === 'asc' ? 'asc' : ('desc' as const);
  switch (sortBy) {
    case 'name': return { name: dir };
    case 'mrp': return { mrp: dir };
    case 'productCode': return { productCode: dir };
    default: return { createdAt: dir };
  }
}

// ── PUBLIC: List products ─────────────────────────────────────────────────────
export async function listProducts(query: ProductQueryInput) {
  const { page, pageSize, skip, take } = parsePagination(query.page, query.pageSize);
  const where = buildProductWhere(query);
  const orderBy = buildProductOrderBy(query.sortBy ?? 'createdAt', query.sortOrder ?? 'desc');

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip, take, select: productPublicSelect }),
  ]);

  return { products, pagination: buildPaginationMeta(total, page, pageSize) };
}

// ── PUBLIC: Get product by slug ────────────────────────────────────────────────
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: productPublicSelect,
  });
  if (!product) throw AppError.notFound('Product');
  return product;
}

// ── ADMIN: Get product by ID (includes isActive=false) ────────────────────────
export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { ...productPublicSelect, isActive: true },
  });
  if (!product) throw AppError.notFound('Product');
  return product;
}

// ── ADMIN: Create product ─────────────────────────────────────────────────────
export async function createProduct(data: CreateProductInput) {
  const slug = await generateUniqueSlug(data.name, 'product');

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      productCode: data.productCode ?? null,
      description: data.description ?? null,
      brandId: data.brandId ?? null,
      categoryId: data.categoryId ?? null,
      material: data.material ?? null,
      capacity: data.capacity ?? null,
      dimensions: data.dimensions ?? null,
      setContents: data.setContents ?? null,
      piecesPerSet: data.piecesPerSet ?? null,
      packagingInformation: data.packagingInformation ?? null,
      features: data.features ?? [],
      mrp: data.mrp ?? null,
      isFeatured: data.isFeatured ?? false,
      isNewArrival: data.isNewArrival ?? false,
      isActive: data.isActive ?? true,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
    },
    select: productPublicSelect,
  });

  return product;
}

// ── ADMIN: Update product ─────────────────────────────────────────────────────
export async function updateProduct(id: string, data: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
  if (!existing) throw AppError.notFound('Product');

  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    slug = await generateUniqueSlug(data.name, 'product', id);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name, slug }),
      ...(data.productCode !== undefined && { productCode: data.productCode }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.brandId !== undefined && { brandId: data.brandId }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.material !== undefined && { material: data.material }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.dimensions !== undefined && { dimensions: data.dimensions }),
      ...(data.setContents !== undefined && { setContents: data.setContents }),
      ...(data.piecesPerSet !== undefined && { piecesPerSet: data.piecesPerSet }),
      ...(data.packagingInformation !== undefined && { packagingInformation: data.packagingInformation }),
      ...(data.features !== undefined && { features: data.features }),
      ...(data.mrp !== undefined && { mrp: data.mrp }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.isNewArrival !== undefined && { isNewArrival: data.isNewArrival }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
    },
    select: productPublicSelect,
  });

  return product;
}

// ── ADMIN: Delete product ─────────────────────────────────────────────────────
export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Product');
  await prisma.product.delete({ where: { id } });
}

// ── ADMIN: Add product image ───────────────────────────────────────────────────
export async function addProductImage(
  productId: string,
  imageUrl: string,
  altText?: string,
  sortOrder?: number,
) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw AppError.notFound('Product');

  return prisma.productImage.create({
    data: { productId, imageUrl, altText: altText ?? null, sortOrder: sortOrder ?? 0 },
    select: imageSelect,
  });
}

// ── ADMIN: Delete product image ────────────────────────────────────────────────
export async function deleteProductImage(imageId: string) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId }, select: { id: true } });
  if (!image) throw AppError.notFound('Image');
  await prisma.productImage.delete({ where: { id: imageId } });
}
