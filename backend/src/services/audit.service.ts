// =============================================================================
// Audit Log service — record all important admin actions
// =============================================================================
import prisma from '../config/database';
import { AuditAction } from '@prisma/client';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { Request } from 'express';

const auditSelect = {
  id: true,
  userId: true,
  userEmail: true,
  userName: true,
  action: true,
  entity: true,
  entityId: true,
  details: true,
  ipAddress: true,
  createdAt: true,
};

export interface LogAuditInput {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  action: AuditAction;
  entity?: string | null;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(data: LogAuditInput) {
  try {
    await prisma.auditLog.create({ data });
  } catch {
    // Never let audit logging break the main request
  }
}

export function auditFromRequest(req: Request, action: AuditAction, entity?: string, entityId?: string, details?: string) {
  return logAudit({
    userId: req.user?.id ?? null,
    userEmail: req.user?.email ?? null,
    userName: req.user?.name ?? null,
    action,
    entity: entity ?? null,
    entityId: entityId ?? null,
    details: details ?? null,
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  });
}

export async function listAuditLogs(pageStr?: string, pageSizeStr?: string, action?: string, entity?: string) {
  const { page, pageSize, skip, take } = parsePagination(pageStr, pageSizeStr);

  const where: Record<string, unknown> = {};
  if (action && action !== 'all') where.action = action as AuditAction;
  if (entity && entity !== 'all') where.entity = entity;

  const [total, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: auditSelect,
    }),
  ]);

  return { logs, pagination: buildPaginationMeta(total, page, pageSize) };
}

export async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    featuredProducts,
    newArrivals,
    totalCategories,
    totalBrands,
    totalEnquiries,
    newEnquiries,
    totalCatalogues,
    totalSales,
    recentEnquiries,
    recentSales,
  ] = await prisma.$transaction([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isFeatured: true } }),
    prisma.product.count({ where: { isNewArrival: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.brand.count({ where: { isActive: true } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: 'NEW' } }),
    prisma.catalogue.count({ where: { isActive: true } }),
    prisma.sale.count(),
    prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, name: true, companyName: true, customerType: true,
        status: true, createdAt: true,
        product: { select: { name: true } },
      },
    }),
    prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, saleNumber: true, customerName: true, companyName: true,
        status: true, totalAmount: true, createdAt: true,
      },
    }),
  ]);

  return {
    products: { total: totalProducts, active: activeProducts, featured: featuredProducts, newArrivals },
    categories: totalCategories,
    brands: totalBrands,
    enquiries: { total: totalEnquiries, new: newEnquiries },
    catalogues: totalCatalogues,
    sales: totalSales,
    recentEnquiries,
    recentSales,
  };
}
