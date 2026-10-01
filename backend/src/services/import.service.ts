// ─────────────────────────────────────────────────────────────────────────────
// CSV/Excel product import service
// Validates each row before inserting. Uses a transaction so either
// ALL rows succeed or NONE are written (on hard errors).
// Returns a detailed import report regardless of outcome.
// ─────────────────────────────────────────────────────────────────────────────
import * as XLSX from 'xlsx';
import prisma from '../config/database';
import { generateUniqueSlug } from '../utils/slugify';
import { logger } from '../utils/logger';

interface ImportRow {
  productName?: unknown;
  productCode?: unknown;
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  material?: unknown;
  capacity?: unknown;
  dimensions?: unknown;
  setContents?: unknown;
  piecesPerSet?: unknown;
  packagingInformation?: unknown;
  features?: unknown;
  mrp?: unknown;
  isFeatured?: unknown;
  isNewArrival?: unknown;
}

interface RowResult {
  row: number;
  productName: string;
  status: 'success' | 'error' | 'skipped';
  errors?: string[];
}

interface ImportReport {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  rows: RowResult[];
}

function coerceBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['true', '1', 'yes', 'y'].includes(v.toLowerCase().trim());
  if (typeof v === 'number') return v === 1;
  return false;
}

function coerceNumber(v: unknown): number | null {
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

export async function importProductsFromBuffer(
  buffer: Buffer,
  mimetype: string,
): Promise<ImportReport> {
  // Parse workbook
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: ImportRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const report: ImportReport = {
    total: rows.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    rows: [],
  };

  if (rows.length === 0) {
    return report;
  }

  // Pre-load categories and brands for lookup (case-insensitive name matching)
  const [allCategories, allBrands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true } }),
  ]);

  const categoryMap = new Map<string, string>(); // name/slug -> id
  allCategories.forEach((c) => {
    categoryMap.set(c.name.toLowerCase(), c.id);
    categoryMap.set(c.slug.toLowerCase(), c.id);
  });

  const brandMap = new Map<string, string>(); // name/slug -> id
  allBrands.forEach((b) => {
    brandMap.set(b.name.toLowerCase(), b.id);
    brandMap.set(b.slug.toLowerCase(), b.id);
  });

  // Validate and collect valid rows
  const validRows: Array<{ rowIndex: number; data: Parameters<typeof prisma.product.create>[0]['data'] }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row
    const errors: string[] = [];

    const productName = String(row.productName ?? '').trim();
    if (!productName) {
      errors.push('productName is required');
    }

    // Resolve category
    let categoryId: string | null = null;
    if (row.category) {
      const key = String(row.category).trim().toLowerCase();
      categoryId = categoryMap.get(key) ?? null;
      if (!categoryId) {
        errors.push(`Category "${row.category}" not found`);
      }
    }

    // Resolve brand
    let brandId: string | null = null;
    if (row.brand) {
      const key = String(row.brand).trim().toLowerCase();
      brandId = brandMap.get(key) ?? null;
      if (!brandId) {
        errors.push(`Brand "${row.brand}" not found`);
      }
    }

    if (errors.length > 0) {
      report.rows.push({ row: rowNum, productName: productName || '(empty)', status: 'error', errors });
      report.failed++;
      continue;
    }

    const mrp = coerceNumber(row.mrp);

    // Parse features (comma-separated string or array)
    let features: string[] = [];
    if (row.features) {
      const raw = String(row.features).trim();
      features = raw
        .split(/[,;|]/)
        .map((f) => f.trim())
        .filter(Boolean);
    }

    validRows.push({
      rowIndex: rowNum,
      data: {
        name: productName,
        slug: '', // will be resolved below
        productCode: row.productCode ? String(row.productCode).trim() : null,
        description: row.description ? String(row.description).trim() : null,
        brandId,
        categoryId,
        material: row.material ? String(row.material).trim() : null,
        capacity: row.capacity ? String(row.capacity).trim() : null,
        dimensions: row.dimensions ? String(row.dimensions).trim() : null,
        setContents: row.setContents ? String(row.setContents).trim() : null,
        piecesPerSet: row.piecesPerSet ? parseInt(String(row.piecesPerSet), 10) || null : null,
        packagingInformation: row.packagingInformation ? String(row.packagingInformation).trim() : null,
        features,
        mrp: mrp ? mrp : null,
        isFeatured: coerceBool(row.isFeatured),
        isNewArrival: coerceBool(row.isNewArrival),
        isActive: true,
      },
    });
  }

  // Resolve unique slugs (outside transaction to avoid long-held locks)
  for (const vr of validRows) {
    vr.data.slug = await generateUniqueSlug(String(vr.data.name), 'product');
  }

  // Insert using a transaction — all or nothing
  if (validRows.length > 0) {
    try {
      await prisma.$transaction(
        validRows.map((vr) => prisma.product.create({ data: vr.data })),
      );

      for (const vr of validRows) {
        report.rows.push({
          row: vr.rowIndex,
          productName: String(vr.data.name),
          status: 'success',
        });
        report.successful++;
      }
    } catch (err) {
      logger.error('Product import transaction failed', { err });
      for (const vr of validRows) {
        report.rows.push({
          row: vr.rowIndex,
          productName: String(vr.data.name),
          status: 'error',
          errors: ['Database insert failed — transaction rolled back'],
        });
        report.failed++;
      }
    }
  }

  return report;
}
