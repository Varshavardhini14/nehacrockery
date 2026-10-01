// ─────────────────────────────────────────────────────────────────────────────
// API Response helper — consistent response shape across all endpoints
// ─────────────────────────────────────────────────────────────────────────────
import { Response } from 'express';

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    message: message ?? 'OK',
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message?: string,
): void {
  res.status(200).json({
    success: true,
    message: message ?? 'OK',
    data,
    pagination,
  });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
