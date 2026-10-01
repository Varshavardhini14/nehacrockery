// ─────────────────────────────────────────────────────────────────────────────
// Authentication tests
// ─────────────────────────────────────────────────────────────────────────────
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

let adminToken: string;
let adminCookie: string;

const ADMIN_EMAIL = 'test-admin@nehacrockery.com';
const ADMIN_PASSWORD = 'TestPassword123!';

beforeAll(async () => {
  // Ensure test user exists
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash: hash, isActive: true },
    create: {
      name: 'Test Admin',
      email: ADMIN_EMAIL,
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/login', () => {
  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'password' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nehacrockery.com', password: 'password' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(ADMIN_EMAIL);
    expect(res.body.data.user).not.toHaveProperty('passwordHash');

    adminToken = res.body.data.token;
    // Extract cookie
    const setCookie = res.headers['set-cookie'] as string[] | undefined;
    if (setCookie) {
      adminCookie = setCookie[0].split(';')[0];
    }
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(ADMIN_EMAIL);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should logout and clear cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// Export token for other test files
export { adminToken as getAdminToken, ADMIN_EMAIL, ADMIN_PASSWORD };
