// ─────────────────────────────────────────────────────────────────────────────
// Authentication & Authorization middleware
// Supports: own JWT (legacy) + Supabase JWT (new)
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import prisma from '../config/database';

interface JwtPayload {
  userId?: string;      // Own JWT
  sub?: string;         // Supabase JWT (user UUID)
  email?: string;
  role?: UserRole;
  iss?: string;         // Supabase JWT: 'https://<project>.supabase.co/auth/v1'
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
 * Verifies the JWT from the Authorization header.
 * Accepts both our own JWT and Supabase JWT tokens.
 * Attaches decoded user to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      (req.cookies as Record<string, string>)?.['nch_token'] ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      throw AppError.unauthorized('Authentication token is required');
    }

    let payload: JwtPayload | null = null;
    let isSupabaseToken = false;

    // Try Supabase JWT first (if configured)
    const supabaseJwtSecret = process.env['SUPABASE_JWT_SECRET'];
    if (supabaseJwtSecret) {
      try {
        payload = jwt.verify(token, supabaseJwtSecret) as JwtPayload;
        isSupabaseToken = !!(payload.sub && !payload.userId);
      } catch {
        // Not a Supabase token, try our own JWT below
      }
    }

    // Fall back to our own JWT
    if (!payload || (!isSupabaseToken && !payload.userId)) {
      try {
        payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
        isSupabaseToken = false;
      } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
          throw AppError.unauthorized('Invalid or expired token');
        }
        throw err;
      }
    }

    let user: { id: string; email: string; role: UserRole; name: string; isActive: boolean } | null = null;

    if (isSupabaseToken && payload.sub) {
      // Supabase JWT: look up by email (Supabase stores email in payload)
      const email = payload.email ?? '';
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, email: true, role: true, name: true, isActive: true },
      });
    } else if (payload.userId) {
      // Own JWT: look up by userId
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, name: true, isActive: true },
      });
    }

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account is not active or not found');
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
