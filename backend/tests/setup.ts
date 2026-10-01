// ─────────────────────────────────────────────────────────────────────────────
// Test setup — load test environment variables
// ─────────────────────────────────────────────────────────────────────────────
import * as dotenv from 'dotenv';

// Load test-specific environment or fall back to .env
dotenv.config({ path: '.env.test', override: false });
dotenv.config({ path: '.env', override: false });

// Ensure required vars have test defaults
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-for-jest-at-least-64-chars-longgggggggggggggggg';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/neha_crockery_test?schema=public';
process.env.PORT = '4001';
