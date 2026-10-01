// ─────────────────────────────────────────────────────────────────────────────
// Zod validators for category and brand endpoints
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';

// ── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  description: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ── Brand ─────────────────────────────────────────────────────────────────────

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(255),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  isOwnBrand: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
