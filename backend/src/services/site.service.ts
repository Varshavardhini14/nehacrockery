// ─────────────────────────────────────────────────────────────────────────────
// Remaining services: Banner, SiteSettings, Review, Catalogue
// ─────────────────────────────────────────────────────────────────────────────
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

// ── BANNERS ───────────────────────────────────────────────────────────────────

const bannerSelect = {
  id: true,
  title: true,
  subtitle: true,
  image: true,
  buttonText: true,
  buttonUrl: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listBanners(adminMode = false) {
  return prisma.banner.findMany({
    where: adminMode ? undefined : { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: bannerSelect,
  });
}

export async function createBanner(data: {
  title: string;
  subtitle?: string | null;
  image: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return prisma.banner.create({ data, select: bannerSelect });
}

export async function updateBanner(id: string, data: Partial<Parameters<typeof createBanner>[0]>) {
  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Banner');
  return prisma.banner.update({ where: { id }, data, select: bannerSelect });
}

export async function deleteBanner(id: string) {
  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Banner');
  await prisma.banner.delete({ where: { id } });
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────

const reviewSelect = {
  id: true,
  customerName: true,
  businessName: true,
  customerType: true,
  rating: true,
  reviewText: true,
  source: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
};

export async function listReviews(publishedOnly = true) {
  return prisma.review.findMany({
    where: publishedOnly ? { isPublished: true } : undefined,
    orderBy: { createdAt: 'desc' },
    select: reviewSelect,
  });
}

export async function createReview(data: {
  customerName: string;
  businessName?: string | null;
  customerType?: string;
  rating: number;
  reviewText: string;
  source?: string | null;
  isPublished?: boolean;
}) {
  return prisma.review.create({ data: data as Parameters<typeof prisma.review.create>[0]['data'], select: reviewSelect });
}

export async function updateReview(id: string, data: Partial<Parameters<typeof createReview>[0]>) {
  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Review');
  return prisma.review.update({ where: { id }, data: data as Parameters<typeof prisma.review.update>[0]['data'], select: reviewSelect });
}

export async function deleteReview(id: string) {
  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Review');
  await prisma.review.delete({ where: { id } });
}

// ── SITE SETTINGS ─────────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  return settings;
}

export async function upsertSiteSettings(data: Partial<{
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  warehouseAddress: string;
  businessHours: string;
  googleMapsUrl: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  linkedin: string;
  gstNumber: string;
  panNumber: string;
}>) {
  const existing = await prisma.siteSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  if (existing) {
    return prisma.siteSettings.update({ where: { id: existing.id }, data });
  }
  return prisma.siteSettings.create({
    data: { businessName: data.businessName ?? 'Neha Crockery House', ...data },
  });
}

// ── CATALOGUES ────────────────────────────────────────────────────────────────

const catalogueSelect = {
  id: true,
  title: true,
  fileUrl: true,
  version: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listCatalogues(adminMode = false) {
  return prisma.catalogue.findMany({
    where: adminMode ? undefined : { isActive: true },
    orderBy: { createdAt: 'desc' },
    select: catalogueSelect,
  });
}

export async function createCatalogue(data: {
  title: string;
  fileUrl: string;
  version?: string | null;
  isActive?: boolean;
}) {
  return prisma.catalogue.create({ data, select: catalogueSelect });
}

export async function updateCatalogue(id: string, data: Partial<Parameters<typeof createCatalogue>[0]>) {
  const existing = await prisma.catalogue.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Catalogue');
  return prisma.catalogue.update({ where: { id }, data, select: catalogueSelect });
}

export async function deleteCatalogue(id: string) {
  const existing = await prisma.catalogue.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Catalogue');
  await prisma.catalogue.delete({ where: { id } });
}
