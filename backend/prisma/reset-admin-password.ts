// Quick utility to reset the admin password — run once, then delete.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@nehacrockery.com';
  const password = process.env.ADMIN_PASSWORD ?? '2331@Sai';

  console.log(`Resetting password for: ${email}`);
  const passwordHash = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where: { email },
    data: { passwordHash, isActive: true },
  });

  console.log(`✅  Password updated for ${updated.email} (role: ${updated.role})`);
}

main()
  .catch((e) => {
    console.error('❌  Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
