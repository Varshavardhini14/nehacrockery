// ─────────────────────────────────────────────────────────────────────────────
// Authentication service — login, logout, token creation
// ─────────────────────────────────────────────────────────────────────────────
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import prisma from '../config/database';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { LoginInput } from '../validators/auth.validator';

function createJwt(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function setAuthCookie(res: Response, token: string): void {
  const maxAgeMs = config.jwt.cookieExpiresDays * 24 * 60 * 60 * 1000;
  res.cookie('nch_token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie('nch_token', { httpOnly: true, path: '/' });
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    // Use same error message to prevent email enumeration
    throw AppError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  logger.info(`User logged in: ${user.email} (${user.role})`);

  const token = createJwt(user.id, user.email, user.role);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, lastLogin: true, createdAt: true },
  });

  if (!user) {
    throw AppError.notFound('User');
  }

  return user;
}
