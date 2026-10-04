// ─────────────────────────────────────────────────────────────────────────────
// Site controller — banners, reviews, site settings, catalogues
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import * as siteService from '../services/site.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse';

// ── BANNERS ───────────────────────────────────────────────────────────────────

export async function listBanners(_req: Request, res: Response): Promise<void> {
  const banners = await siteService.listBanners();
  sendSuccess(res, banners);
}

export async function adminListBanners(_req: Request, res: Response): Promise<void> {
  const banners = await siteService.listBanners(true);
  sendSuccess(res, banners);
}

export async function adminCreateBanner(req: Request, res: Response): Promise<void> {
  const banner = await siteService.createBanner(req.body);
  sendCreated(res, banner, 'Banner created');
}

export async function adminUpdateBanner(req: Request, res: Response): Promise<void> {
  const banner = await siteService.updateBanner(req.params.id, req.body);
  sendSuccess(res, banner, 'Banner updated');
}

export async function adminDeleteBanner(req: Request, res: Response): Promise<void> {
  await siteService.deleteBanner(req.params.id);
  sendNoContent(res);
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────

export async function listReviews(_req: Request, res: Response): Promise<void> {
  const reviews = await siteService.listReviews(true);
  sendSuccess(res, reviews);
}

export async function adminListReviews(_req: Request, res: Response): Promise<void> {
  const reviews = await siteService.listReviews(false);
  sendSuccess(res, reviews);
}

export async function adminCreateReview(req: Request, res: Response): Promise<void> {
  const review = await siteService.createReview(req.body);
  sendCreated(res, review, 'Review created');
}

export async function adminUpdateReview(req: Request, res: Response): Promise<void> {
  const review = await siteService.updateReview(req.params.id, req.body);
  sendSuccess(res, review, 'Review updated');
}

export async function adminDeleteReview(req: Request, res: Response): Promise<void> {
  await siteService.deleteReview(req.params.id);
  sendNoContent(res);
}

// ── SITE SETTINGS ─────────────────────────────────────────────────────────────

export async function getSiteSettings(_req: Request, res: Response): Promise<void> {
  const settings = await siteService.getSiteSettings();
  sendSuccess(res, settings);
}

export async function adminUpdateSettings(req: Request, res: Response): Promise<void> {
  const settings = await siteService.upsertSiteSettings(req.body);
  sendSuccess(res, settings, 'Settings updated');
}

// ── CATALOGUES ────────────────────────────────────────────────────────────────

export async function listCatalogues(_req: Request, res: Response): Promise<void> {
  const catalogues = await siteService.listCatalogues();
  sendSuccess(res, catalogues);
}

export async function adminListCatalogues(_req: Request, res: Response): Promise<void> {
  const catalogues = await siteService.listCatalogues(true);
  sendSuccess(res, catalogues);
}

export async function adminCreateCatalogue(req: Request, res: Response): Promise<void> {
  // File upload via multer sets req.file; plain JSON uses req.body.fileUrl
  const uploadedFile = req.file as Express.Multer.File | undefined;
  const fileUrl = uploadedFile
    ? `/uploads/catalogues/${uploadedFile.filename}`
    : req.body.fileUrl;

  if (!fileUrl) {
    res.status(400).json({ success: false, message: 'A PDF file or fileUrl is required' });
    return;
  }

  const catalogue = await siteService.createCatalogue({
    title: req.body.title,
    fileUrl,
    version: req.body.version || null,
    isActive: req.body.isActive === 'false' ? false : req.body.isActive === 'true' ? true : req.body.isActive ?? true,
  });
  sendCreated(res, catalogue, 'Catalogue created');
}

export async function adminUpdateCatalogue(req: Request, res: Response): Promise<void> {
  const catalogue = await siteService.updateCatalogue(req.params.id, req.body);
  sendSuccess(res, catalogue, 'Catalogue updated');
}

export async function adminDeleteCatalogue(req: Request, res: Response): Promise<void> {
  await siteService.deleteCatalogue(req.params.id);
  sendNoContent(res);
}

// ── SHOP GALLERY ──────────────────────────────────────────────────────────────

export async function listShopMedia(_req: Request, res: Response): Promise<void> {
  const media = await siteService.listShopMedia(false);
  sendSuccess(res, media);
}

export async function adminListShopMedia(_req: Request, res: Response): Promise<void> {
  const media = await siteService.listShopMedia(true);
  sendSuccess(res, media);
}

export async function adminCreateShopMedia(req: Request, res: Response): Promise<void> {
  const uploadedFile = req.file as Express.Multer.File | undefined;

  if (!uploadedFile && !req.body.mediaUrl) {
    res.status(400).json({ success: false, message: 'A file or mediaUrl is required' });
    return;
  }

  const isVideo = uploadedFile
    ? uploadedFile.mimetype.startsWith('video/')
    : (req.body.mediaType === 'video');

  const mediaUrl = uploadedFile
    ? `/uploads/shop-gallery/${uploadedFile.filename}`
    : req.body.mediaUrl;

  const media = await siteService.createShopMedia({
    title: req.body.title || null,
    description: req.body.description || null,
    mediaUrl,
    mediaType: isVideo ? 'video' : 'image',
    thumbnailUrl: req.body.thumbnailUrl || null,
    sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder, 10) : 0,
    isActive: req.body.isActive === 'false' ? false : true,
  });
  sendCreated(res, media, 'Shop media uploaded');
}

export async function adminUpdateShopMedia(req: Request, res: Response): Promise<void> {
  const media = await siteService.updateShopMedia(req.params.id, {
    title: req.body.title,
    description: req.body.description,
    thumbnailUrl: req.body.thumbnailUrl,
    sortOrder: req.body.sortOrder !== undefined ? parseInt(req.body.sortOrder, 10) : undefined,
    isActive: req.body.isActive !== undefined
      ? req.body.isActive === 'false' ? false : Boolean(req.body.isActive)
      : undefined,
  });
  sendSuccess(res, media, 'Shop media updated');
}

export async function adminDeleteShopMedia(req: Request, res: Response): Promise<void> {
  await siteService.deleteShopMedia(req.params.id);
  sendNoContent(res);
}

