// ─────────────────────────────────────────────────────────────────────────────
// Enquiry and Catalogue Request service
// ─────────────────────────────────────────────────────────────────────────────
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import type { CreateEnquiryInput, UpdateEnquiryStatusInput, CreateCatalogueRequestInput } from '../validators/enquiry.validator';
import { EnquiryStatus } from '@prisma/client';

// ── ENQUIRIES ─────────────────────────────────────────────────────────────────

const enquirySelect = {
  id: true,
  name: true,
  companyName: true,
  phone: true,
  email: true,
  customerType: true,
  message: true,
  quantity: true,
  source: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  product: { select: { id: true, name: true, slug: true, productCode: true } },
};

export async function createEnquiry(data: CreateEnquiryInput) {
  // Verify product exists if provided
  if (data.productId) {
    const product = await prisma.product.findUnique({ where: { id: data.productId }, select: { id: true } });
    if (!product) throw AppError.notFound('Product');
  }

  return prisma.enquiry.create({
    data: {
      name: data.name,
      companyName: data.companyName ?? null,
      phone: data.phone,
      email: data.email ?? null,
      customerType: data.customerType,
      message: data.message ?? null,
      productId: data.productId ?? null,
      quantity: data.quantity ?? null,
      source: data.source ?? 'website',
      status: EnquiryStatus.NEW,
    },
    select: enquirySelect,
  });
}

export async function listEnquiries(
  status?: string,
  pageStr?: string,
  pageSizeStr?: string,
) {
  const { page, pageSize, skip, take } = parsePagination(pageStr, pageSizeStr);
  const where = status && status !== 'all' ? { status: status as EnquiryStatus } : {};

  const [total, enquiries] = await prisma.$transaction([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: enquirySelect,
    }),
  ]);

  return { enquiries, pagination: buildPaginationMeta(total, page, pageSize) };
}

export async function getEnquiryById(id: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id }, select: enquirySelect });
  if (!enquiry) throw AppError.notFound('Enquiry');
  return enquiry;
}

export async function updateEnquiryStatus(id: string, data: UpdateEnquiryStatusInput) {
  const existing = await prisma.enquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Enquiry');
  return prisma.enquiry.update({ where: { id }, data: { status: data.status }, select: enquirySelect });
}

// ── CATALOGUE REQUESTS ────────────────────────────────────────────────────────

const catalogueRequestSelect = {
  id: true,
  name: true,
  companyName: true,
  phone: true,
  email: true,
  customerType: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export async function createCatalogueRequest(data: CreateCatalogueRequestInput) {
  return prisma.catalogueRequest.create({ data, select: catalogueRequestSelect });
}

export async function listCatalogueRequests(pageStr?: string, pageSizeStr?: string) {
  const { page, pageSize, skip, take } = parsePagination(pageStr, pageSizeStr);

  const [total, requests] = await prisma.$transaction([
    prisma.catalogueRequest.count(),
    prisma.catalogueRequest.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: catalogueRequestSelect,
    }),
  ]);

  return { requests, pagination: buildPaginationMeta(total, page, pageSize) };
}
