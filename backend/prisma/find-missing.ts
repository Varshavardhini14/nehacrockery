import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();
const prisma = new PrismaClient();

const XLSX_PATH = path.resolve(__dirname, "../../data/Neha_Crockery_House_MASTER_DATABASE_LUMINARC_DINNERWARE_NAMES_VERIFIED_FINAL.xlsx");
const BRAND_MAP: Record<string,string> = {"larah glassware":"Larah","larah":"Larah","luminarc glassware":"Luminarc","luminarc dinnerware":"Luminarc","koko":"KOKO","krista":"Krista"};

async function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Master_Products"];
  const rows: Record<string,unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });

  // Get all DB products with their brand
  const dbProducts = await prisma.product.findMany({ select: { name: true, brandId: true, brand: { select: { name: true } } } });
  const dbSet = new Set(dbProducts.map(p => p.name + "|||" + (p.brand?.name || "")));
  
  // Find Excel rows not in DB
  const seen = new Set<string>();
  const missing: Array<{name:string, brand:string, code:string}> = [];
  
  for (const row of rows) {
    const name = String(row["Product Name (Normalized)"] || "").trim();
    const brand = String(row["Brand / Catalogue"] || "").trim();
    const code = String(row["Product Code / Art No."] || "").trim();
    const nb = BRAND_MAP[brand.toLowerCase()] || brand;
    const key = name + "|||" + nb;
    if (name && !seen.has(key)) {
      seen.add(key);
      if (!dbSet.has(key)) {
        missing.push({ name, brand: nb, code });
      }
    }
  }
  
  console.log("Products in Excel (unique):", seen.size);
  console.log("Products in DB:", dbProducts.length);
  console.log("Missing from DB:", missing.length);
  console.log("\nMissing products by brand:");
  const byBrand: Record<string,number> = {};
  missing.forEach(m => { byBrand[m.brand] = (byBrand[m.brand] || 0) + 1; });
  console.log(JSON.stringify(byBrand, null, 2));
  if (missing.length <= 30) {
    console.log("\nAll missing products:");
    missing.forEach(m => console.log("  " + m.brand + " | " + m.name + " | " + m.code));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());