// ─────────────────────────────────────────────────────────────────────────────
// Enquiry controller
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import * as enquiryService from '../services/enquiry.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export async function createEnquiry(req: Request, res: Response): Promise<void> {
  const enquiry = await enquiryService.createEnquiry(req.body);
  sendCreated(res, enquiry, 'Your enquiry has been received. We will contact you shortly.');
}

export async function createCatalogueRequest(req: Request, res: Response): Promise<void> {
  const request = await enquiryService.createCatalogueRequest(req.body);
  sendCreated(res, request, 'Your catalogue request has been received.');
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export async function adminListEnquiries(req: Request, res: Response): Promise<void> {
  const { status, page, pageSize } = req.query as Record<string, string>;
  const { enquiries, pagination } = await enquiryService.listEnquiries(status, page, pageSize);
  sendPaginated(res, enquiries, pagination);
}

export async function adminGetEnquiry(req: Request, res: Response): Promise<void> {
  const enquiry = await enquiryService.getEnquiryById(req.params.id);
  sendSuccess(res, enquiry);
}

export async function adminUpdateEnquiryStatus(req: Request, res: Response): Promise<void> {
  const enquiry = await enquiryService.updateEnquiryStatus(req.params.id, req.body);
  sendSuccess(res, enquiry, 'Enquiry status updated');
}
