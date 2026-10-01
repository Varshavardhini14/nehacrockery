// ─────────────────────────────────────────────────────────────────────────────
// Authentication controller — thin, delegates to auth service
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';

export async function login(req: Request, res: Response): Promise<void> {
  const { token, user } = await authService.loginUser(req.body);
  authService.setAuthCookie(res, token);
  sendSuccess(res, { user, token }, 'Login successful');
}

export async function logout(_req: Request, res: Response): Promise<void> {
  authService.clearAuthCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, user);
}
