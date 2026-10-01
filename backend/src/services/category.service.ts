// ─────────────────────────────────────────────────────────────────────────────
// Category and Brand service
// ─────────────────────────────────────────────────────────────────────────────
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { generateUniqueSlug } from '../utils/slugify';
import type { CreateCategoryInput, UpdateCategoryInput, CreateBrandInput, UpdateBrandInput } from '../validators/catalogue.validator';

// ── CATEGORIES ────────────────────────────────────────────────────────────────

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  parentId: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
};

export async function listCategories(includeInactive = false) {
  return prisma.category.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: categorySelect,
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { ...categorySelect, children: { select: categorySelect } },
  });
  if (!category) throw AppError.notFound('Category');
  return category;
}

export async function createCategory(data: CreateCategoryInput) {
  const slug = await generateUniqueSlug(data.name, 'category');
  return prisma.category.create({
    data: { ...data, slug },
    select: categorySelect,
  });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) throw AppError.notFound('Category');

  let slug: string | undefined;
  if (data.name && data.name !== existing.name) {
    slug = await generateUniqueSlug(data.name, 'category', id);
  }

  return prisma.category.update({
    where: { id },
    data: { ...data, ...(slug && { slug }) },
    select: categorySelect,
  });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!existing) throw AppError.notFound('Category');
  if (existing._count.products > 0) {
    throw AppError.conflict('Cannot delete category with existing products. Reassign or remove products first.');
  }
  await prisma.category.delete({ where: { id } });
}

// ── BRANDS ────────────────────────────────────────────────────────────────────

const brandSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  description: true,
  website: true,
  isOwnBrand: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
};

export async function listBrands(includeInactive = false) {
  return prisma.brand.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: brandSelect,
  });
}

export async function getBrandBySlug(slug: string) {
  const brand = await prisma.brand.findFirst({
    where: { slug, isActive: true },
    select: brandSelect,
  });
  if (!brand) throw AppError.notFound('Brand');
  return brand;
}

export async function createBrand(data: CreateBrandInput) {
  const slug = await generateUniqueSlug(data.name, 'brand');
  return prisma.brand.create({
    data: { ...data, slug },
    select: brandSelect,
  });
}

export async function updateBrand(id: string, data: UpdateBrandInput) {
  const existing = await prisma.brand.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) throw AppError.notFound('Brand');

  let slug: string | undefined;
  if (data.name && data.name !== existing.name) {
    slug = await generateUniqueSlug(data.name, 'brand', id);
  }

  return prisma.brand.update({
    where: { id },
    data: { ...data, ...(slug && { slug }) },
    select: brandSelect,
  });
}

export async function deleteBrand(id: string) {
  const existing = await prisma.brand.findUnique({
    where: { id },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!existing) throw AppError.notFound('Brand');
  if (existing._count.products > 0) {
    throw AppError.conflict('Cannot delete brand with existing products. Reassign or remove products first.');
  }
  await prisma.brand.delete({ where: { id } });
}
