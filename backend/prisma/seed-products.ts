// =============================================================================
// NEHA CROCKERY HOUSE - FAST BATCH PRODUCT IMPORT
// Uses createMany with skipDuplicates for bulk performance
// Run: npx ts-node --project tsconfig.seed.json prisma/seed-products.ts
// =============================================================================
import { PrismaClient, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const XLSX_PATH = path.resolve(
  __dirname,
  "../../data/Neha_Crockery_House_MASTER_DATABASE_LUMINARC_DINNERWARE_NAMES_VERIFIED_FINAL.xlsx"
);

const BRAND_NORMALISE: Record<string, string> = {
  "larah glassware": "Larah",
  larah: "Larah",
  "luminarc glassware": "Luminarc",
  "luminarc dinnerware": "Luminarc",
  koko: "KOKO",
  krista: "Krista",
};

const CATEGORY_NORMALISE: Record<string, string> = {
  glassware: "Glassware & Bottles",
  tableware: "Crockery & Dinnerware",
  dinnerware: "Crockery & Dinnerware",
  "mugs & cups": "Crockery & Dinnerware",
  cutlery: "Cutlery",
};

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function decimal(v: unknown): Prisma.Decimal | null {
  const s = str(v).replace(/[^0-9.]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : new Prisma.Decimal(n);
}

function intVal(v: unknown): number | null {
  const n = parseInt(str(v), 10);
  return isNaN(n) ? null : n;
}

function boolVal(v: unknown): boolean {
  const s = str(v).toLowerCase();
  return ["yes", "true", "1", "y"].includes(s);
}

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("\n=== NCH FAST BATCH PRODUCT IMPORT ===\n");

  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Master_Products"];
  if (!ws) throw new Error('Sheet "Master_Products" not found');

  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
  });
  console.log("Rows in Excel: " + rows.length);

  // â”€â”€ Upsert Brands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("\n-- Upserting brands --");
  const uniqueBrandNames = [...new Set(Object.values(BRAND_NORMALISE)), "Taroba"];
  const brandSortOrder: Record<string, number> = { Taroba: 1, Larah: 2, Luminarc: 3, KOKO: 4, Krista: 5 };
  const brandMap = new Map<string, string>();

  for (const brandName of uniqueBrandNames) {
    const slug = makeSlug(brandName);
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { isActive: true },
      create: { name: brandName, slug, isOwnBrand: brandName === "Taroba", sortOrder: brandSortOrder[brandName] ?? 99, isActive: true },
    });
    brandMap.set(brandName.toLowerCase(), brand.id);
    console.log("  Brand: " + brandName + " -> " + brand.id);
  }

  // â”€â”€ Upsert Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("\n-- Upserting categories --");
  const requiredCategories = [
    { name: "Crockery & Dinnerware", sortOrder: 1 },
    { name: "Cutlery", sortOrder: 2 },
    { name: "Glassware & Bottles", sortOrder: 3 },
    { name: "Melamineware", sortOrder: 4 },
    { name: "Acrylicware", sortOrder: 5 },
    { name: "Kitchenware", sortOrder: 6 },
    { name: "Hotelware & Institutional Supply", sortOrder: 7 },
    { name: "Wooden Handicrafts", sortOrder: 8 },
  ];
  const categoryMap = new Map<string, string>();

  for (const cat of requiredCategories) {
    const slug = makeSlug(cat.name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { isActive: true },
      create: { name: cat.name, slug, sortOrder: cat.sortOrder, isActive: true },
    });
    categoryMap.set(slug, category.id);
    console.log("  Category: " + cat.name);
  }

  function resolveCategoryId(excelCat: string): string | null {
    if (!excelCat) return null;
    const key = excelCat.toLowerCase().trim();
    const normName = CATEGORY_NORMALISE[key];
    if (normName) return categoryMap.get(makeSlug(normName)) ?? null;
    return categoryMap.get(makeSlug(excelCat)) ?? null;
  }

  // â”€â”€ Pre-load existing product codes and name+brand combos to skip dups â”€â”€â”€
  console.log("\n-- Pre-loading existing products --");
  const existingCodes = new Set(
    (await prisma.product.findMany({ select: { productCode: true } }))
      .map((p) => p.productCode)
      .filter(Boolean) as string[]
  );
  const existingNameBrand = new Set(
    (await prisma.product.findMany({ select: { name: true, brandId: true } }))
      .map((p) => p.name + "|||" + (p.brandId || ""))
  );
  console.log("  Existing product codes in DB: " + existingCodes.size);
  console.log("  Existing name+brand combos: " + existingNameBrand.size);

  // â”€â”€ Build batch of new products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("\n-- Building product batch --");
  const toInsert: Prisma.ProductCreateManyInput[] = [];
  const slugsSeen = new Set<string>();
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const productName = str(row["Product Name (Normalized)"]);
    if (!productName) { skipped++; continue; }

    const excelBrand = str(row["Brand / Catalogue"]);
    const normBrand = BRAND_NORMALISE[excelBrand.toLowerCase()] ?? null;
    const brandId = normBrand ? (brandMap.get(normBrand.toLowerCase()) ?? null) : null;
    const categoryId = resolveCategoryId(str(row["Category"]));
    const rawCode = str(row["Product Code / Art No."]);
    const productCode = rawCode || null;

    // Skip if already in DB
    if (productCode && existingCodes.has(productCode)) { skipped++; continue; }
    const nameKey = productName + "|||" + (brandId || "");
    if (existingNameBrand.has(nameKey)) { skipped++; continue; }

    // Build a unique slug - always use row index as suffix to guarantee uniqueness
    let baseSlug = makeSlug(productName);
    let slug = baseSlug;
    if (slugsSeen.has(slug)) {
      slug = baseSlug + "-" + String(i);
    }
    // Further collision avoidance
    let attempt = 0;
    while (slugsSeen.has(slug)) {
      slug = baseSlug + "-" + String(i) + "-" + String(attempt++);
    }
    slugsSeen.add(slug);

    const catalogueMrp = decimal(row["Catalogue MRP"]);

    toInsert.push({
      name: productName,
      slug,
      productCode,
      description: str(row["Description / Source Line"]) || null,
      brandId,
      categoryId,
      material: str(row["Material"]) || null,
      capacity: str(row["Capacity"]) || null,
      dimensions: str(row["Size / Dimensions"]) || null,
      colourFinish: str(row["Colour / Finish"]) || null,
      piecesPerSet: intVal(row["Pieces per Set"]),
      caseQty: intVal(row["Case / Carton Qty"]),
      collection: str(row["Collection / Series"]) || null,
      subcategory: str(row["Subcategory"]) || null,
      mrp: catalogueMrp,
      catalogueMrp,
      priceUnit: str(row["Price Unit"]) || null,
      cataloguePage: str(row["Catalogue Page"]) || null,
      sourceFile: str(row["Source File"]) || null,
      reviewStatus: str(row["Review Status"]) || null,
      nameVerified: boolVal(row["Product Name Source Verified"]),
      isFeatured: false,
      isNewArrival: boolVal(row["New Arrival"]),
      isActive: true,
      features: [],
    });
  }

  console.log("Products to insert (new): " + toInsert.length);
  console.log("Products skipped (existing): " + skipped);

  if (toInsert.length === 0) {
    console.log("\nAll products already in database! Nothing to insert.");
    return;
  }

  // â”€â”€ Batch insert in chunks of 100 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const CHUNK = 100;
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    try {
      const result = await prisma.product.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log("  Chunk " + Math.floor(i / CHUNK + 1) + ": inserted " + result.count + " / " + chunk.length + " (" + totalInserted + " total so far)");
    } catch (err) {
      totalErrors += chunk.length;
      const msg = err instanceof Error ? err.message : String(err);
      console.error("  Chunk " + Math.floor(i / CHUNK + 1) + " FAILED: " + msg);
    }
  }

  // â”€â”€ Final DB count â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const finalCount = await prisma.product.count();

  console.log("\n=== IMPORT COMPLETE ===");
  console.log("Inserted this run:  " + totalInserted);
  console.log("Skipped (existing): " + skipped);
  console.log("Chunk errors:       " + totalErrors);
  console.log("Total in DB now:    " + finalCount);
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });