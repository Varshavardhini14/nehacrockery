// ─────────────────────────────────────────────────────────────────────────────
// Zod validators for enquiry and catalogue-request endpoints
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';
import { CustomerType, EnquiryStatus } from '@prisma/client';

export const createEnquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  companyName: z.string().max(255).optional().nullable().transform((v) => v?.trim() ?? null),
  phone: z
    .string()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20)
    .regex(/^[+\d\s\-()]+$/, 'Invalid phone number format')
    .trim(),
  email: z.string().email('Invalid email').toLowerCase().optional().nullable(),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.INDIVIDUAL),
  message: z.string().max(2000).optional().nullable().transform((v) => v?.trim() ?? null),
  productId: z.string().cuid().optional().nullable(),
  quantity: z.string().max(100).optional().nullable(),
  source: z.string().max(100).optional().default('website'),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.nativeEnum(EnquiryStatus),
});

export const createCatalogueRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  companyName: z.string().max(255).optional().nullable().transform((v) => v?.trim() ?? null),
  phone: z
    .string()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20)
    .regex(/^[+\d\s\-()]+$/, 'Invalid phone number format')
    .trim(),
  email: z.string().email('Invalid email').toLowerCase().optional().nullable(),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.INDIVIDUAL),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryStatusInput = z.infer<typeof updateEnquiryStatusSchema>;
export type CreateCatalogueRequestInput = z.infer<typeof createCatalogueRequestSchema>;
