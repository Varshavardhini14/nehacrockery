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
  const catalogue = await siteService.createCatalogue(req.body);
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
