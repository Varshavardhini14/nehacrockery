// ─────────────────────────────────────────────────────────────────────────────
// Authentication & Authorization middleware
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import prisma from '../config/database';

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
      };
    }
  }
}

/**
 * Verifies the JWT from the httpOnly cookie or Authorization header.
 * Attaches decoded user to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Prefer cookie, fall back to Bearer token for API clients
    const token =
      (req.cookies as Record<string, string>)?.['nch_token'] ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      throw AppError.unauthorized('Authentication token is required');
    }

    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account is not active');
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid or expired token'));
    } else {
      next(err);
    }
  }
}

/**
 * Restricts access to specified roles.
 * Must be used AFTER authenticate.
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
