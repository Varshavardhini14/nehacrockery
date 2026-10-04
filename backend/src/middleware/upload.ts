// ─────────────────────────────────────────────────────────────────────────────
// Multer upload configuration (local storage strategy)
// For production, swap diskStorage with Cloudinary/S3 multer-storage adapter.
// ─────────────────────────────────────────────────────────────────────────────
import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { config } from '../config/env';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf'];

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const imageStorage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'images');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const catalogueStorage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'catalogues');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `catalogue-${uniqueSuffix}${ext}`);
  },
});

const importStorage: StorageEngine = multer.memoryStorage();

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

const maxSizeBytes = config.upload.maxSizeMb * 1024 * 1024;

export const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 10 },
});

export const uploadCatalogue = multer({
  storage: catalogueStorage,
  fileFilter: docFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for PDFs
});

export const uploadImport = multer({
  storage: importStorage,
  fileFilter: csvFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Shop Gallery media (images + videos) ─────────────────────────────────────
const ALLOWED_MEDIA_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
];

const shopMediaStorage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'shop-gallery');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.mimetype.startsWith('video/') ? 'video' : 'photo';
    cb(null, `shop-${prefix}-${uniqueSuffix}${ext}`);
  },
});

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

export const uploadShopMedia = multer({
  storage: shopMediaStorage,
  fileFilter: shopMediaFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 20 }, // 100 MB per file
});

