// =============================================================================
// Dashboard + Audit Log controller
// =============================================================================
import { Request, Response } from 'express';
import * as auditService from '../services/audit.service';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

export async function adminGetDashboard(_req: Request, res: Response): Promise<void> {
  const stats = await auditService.getDashboardStats();
  sendSuccess(res, stats);
}

export async function adminListAuditLogs(req: Request, res: Response): Promise<void> {
  const { page, pageSize, action, entity } = req.query as Record<string, string>;
  const { logs, pagination } = await auditService.listAuditLogs(page, pageSize, action, entity);
  sendPaginated(res, logs, pagination);
}
