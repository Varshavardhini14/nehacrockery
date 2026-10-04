// ─────────────────────────────────────────────────────────────────────────────
// Multer upload configuration — all storage is Supabase Storage.
//
// All multer instances use memoryStorage so files are held in-memory as
// Buffer objects and never written to local disk. The actual upload to
// Supabase happens in the controllers / storage.service after validation.
// ─────────────────────────────────────────────────────────────────────────────
import multer from 'multer';
import { Request } from 'express';
import { config } from '../config/env';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf'];
const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

// ── Filter helpers ─────────────────────────────────────────────────────────────

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
}

function docFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for catalogues'));
  }
}

function csvFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const allowed = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV or Excel files are allowed for import'));
  }
}

function shopMediaFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (ALLOWED_MEDIA_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG/PNG/WebP) and videos (MP4/WebM/MOV) are allowed'));
  }
}

// ── Multer instances (all use memoryStorage) ──────────────────────────────────

const maxSizeBytes = config.upload.maxSizeMb * 1024 * 1024;

/** Product images — up to 10 files, max size from config */
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 10 },
});

/** Catalogue PDFs — single file, up to 50 MB */
export const uploadCatalogue = multer({
  storage: multer.memoryStorage(),
  fileFilter: docFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

/** CSV/Excel product import — single file, up to 5 MB */
export const uploadImport = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** Shop gallery images & videos — single file, up to 100 MB */
export const uploadShopMedia = multer({
  storage: multer.memoryStorage(),
  fileFilter: shopMediaFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 20 },
});
