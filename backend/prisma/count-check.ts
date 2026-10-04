import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.count();
  const brands = await prisma.brand.count();
  const categories = await prisma.category.count();
  console.log("=== DATABASE COUNTS ===");
  console.log("Products:", products);
  console.log("Brands:  ", brands);
  console.log("Categories:", categories);
  const byBrand = await prisma.product.groupBy({ by: ["brandId"], _count: { _all: true } });
  for (const b of byBrand) {
    const brand = b.brandId ? await prisma.brand.findUnique({ where: { id: b.brandId }, select: { name: true } }) : null;
    console.log("  " + (brand?.name || "No Brand") + ": " + b._count._all);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());