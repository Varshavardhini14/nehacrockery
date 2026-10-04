// ─────────────────────────────────────────────────────────────────────────────
// Authentication controller — thin, delegates to auth service
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { auditFromRequest } from '../services/audit.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuditAction } from '@prisma/client';

export async function login(req: Request, res: Response): Promise<void> {
  const { token, user } = await authService.loginUser(req.body);
  authService.setAuthCookie(res, token);
  // Temporarily set req.user for audit logging
  req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
  await auditFromRequest(req, AuditAction.LOGIN, 'User', user.id, `Admin login: ${user.email}`);
  sendSuccess(res, { user, token }, 'Login successful');
}

export async function logout(req: Request, res: Response): Promise<void> {
  await auditFromRequest(req, AuditAction.LOGOUT, 'User', req.user?.id, `Admin logout: ${req.user?.email}`);
  authService.clearAuthCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, user);
}
