// =============================================================================
// Sales service — B2B manually-recorded orders (no payment gateway)
// =============================================================================
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { SaleStatus } from '@prisma/client';

const saleSelect = {
  id: true,
  saleNumber: true,
  customerName: true,
  companyName: true,
  phone: true,
  email: true,
  notes: true,
  status: true,
  totalAmount: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productCode: true,
      quantity: true,
      unitPrice: true,
      total: true,
    },
  },
};

async function generateSaleNumber(): Promise<string> {
  const count = await prisma.sale.count();
  const num = String(count + 1).padStart(4, '0');
  return `NCH-S-${num}`;
}

export interface SaleItemInput {
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleInput {
  customerName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status?: SaleStatus;
  items: SaleItemInput[];
  createdBy?: string;
}

export async function listSales(pageStr?: string, pageSizeStr?: string, status?: string) {
  const { page, pageSize, skip, take } = parsePagination(pageStr, pageSizeStr);
  const where = status && status !== 'all' ? { status: status as SaleStatus } : {};

  const [total, sales] = await prisma.$transaction([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: saleSelect,
    }),
  ]);

  return { sales, pagination: buildPaginationMeta(total, page, pageSize) };
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, select: saleSelect });
  if (!sale) throw AppError.notFound('Sale');
  return sale;
}

export async function createSale(data: CreateSaleInput) {
  const saleNumber = await generateSaleNumber();
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return prisma.sale.create({
    data: {
      saleNumber,
      customerName: data.customerName,
      companyName: data.companyName ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
      status: data.status ?? SaleStatus.QUOTE,
      totalAmount,
      createdBy: data.createdBy ?? null,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId ?? null,
          productName: item.productName,
          productCode: item.productCode ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    select: saleSelect,
  });
}

export async function updateSale(
  id: string,
  data: Partial<Omit<CreateSaleInput, 'items'>> & { status?: SaleStatus; items?: SaleItemInput[] },
) {
  const existing = await prisma.sale.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Sale');

  const updateData: Record<string, unknown> = {};
  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;

  // If items provided, replace them all
  if (data.items) {
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    updateData.totalAmount = totalAmount;
    await prisma.saleItem.deleteMany({ where: { saleId: id } });
    await prisma.saleItem.createMany({
      data: data.items.map((item) => ({
        saleId: id,
        productId: item.productId ?? null,
        productName: item.productName,
        productCode: item.productCode ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    });
  }

  return prisma.sale.update({ where: { id }, data: updateData, select: saleSelect });
}

export async function deleteSale(id: string) {
  const existing = await prisma.sale.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Sale');
  await prisma.sale.delete({ where: { id } });
}

export async function getSaleStats() {
  const [total, byStatus] = await prisma.$transaction([
    prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true }),
    prisma.sale.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { status: 'desc' } },
    }),
  ]);

  return {
    totalSales: total._count,
    totalRevenue: total._sum.totalAmount ?? 0,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: typeof s._count === 'object' && s._count !== null ? s._count._all : 0,
      revenue: s._sum?.totalAmount ?? 0,
    })),
  };
}
