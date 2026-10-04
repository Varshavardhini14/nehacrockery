// Final mopup: inserts remaining missing products.
// For shared product codes (used by multiple products), sets productCode to null
// so there is no unique constraint conflict.
import { PrismaClient, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();
const prisma = new PrismaClient();

const XLSX_PATH = path.resolve(__dirname, "../../data/Neha_Crockery_House_MASTER_DATABASE_LUMINARC_DINNERWARE_NAMES_VERIFIED_FINAL.xlsx");
const BRAND_MAP: Record<string,string> = {"larah glassware":"Larah","larah":"Larah","luminarc glassware":"Luminarc","luminarc dinnerware":"Luminarc","koko":"KOKO","krista":"Krista"};
const CAT_MAP: Record<string,string> = {"glassware":"Glassware & Bottles","tableware":"Crockery & Dinnerware","dinnerware":"Crockery & Dinnerware","mugs & cups":"Crockery & Dinnerware","cutlery":"Cutlery"};

function str(v: unknown): string { return v===null||v===undefined?"":String(v).trim(); }
function decimal(v: unknown): Prisma.Decimal|null { const s=str(v).replace(/[^0-9.]/g,""); const n=parseFloat(s); return isNaN(n)?null:new Prisma.Decimal(n); }
function intVal(v: unknown): number|null { const n=parseInt(str(v),10); return isNaN(n)?null:n; }
function boolVal(v: unknown): boolean { return ["yes","true","1","y"].includes(str(v).toLowerCase()); }
function makeSlug(t: string): string { return t.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,""); }

async function main() {
  console.log("\n=== FINAL MOPUP IMPORT ===\n");
  
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Master_Products"];
  const rows: Record<string,unknown>[] = XLSX.utils.sheet_to_json(ws, { defval:"", raw:false });

  // Pre-scan: find product codes shared by 2+ different names (nullify them)
  const codeToNames = new Map<string,Set<string>>();
  for (const row of rows) {
    const code = str(row["Product Code / Art No."]);
    const name = str(row["Product Name (Normalized)"]);
    if (code && name) {
      if (!codeToNames.has(code)) codeToNames.set(code, new Set());
      codeToNames.get(code)!.add(name);
    }
  }
  const sharedCodes = new Set<string>();
  codeToNames.forEach((names, code) => { if (names.size > 1) sharedCodes.add(code); });
  console.log("Shared/ambiguous product codes (will be nulled):", sharedCodes.size);

  // Load brand/category maps
  const allBrands = await prisma.brand.findMany({ select: { id:true, name:true } });
  const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b.id]));
  const allCats = await prisma.category.findMany({ select: { id:true, slug:true } });
  const catSlugMap = new Map(allCats.map(c => [c.slug, c.id]));
  
  // Existing products
  const dbProducts = await prisma.product.findMany({ select: { name:true, brandId:true, brand:{ select:{ name:true } } } });
  const dbSet = new Set(dbProducts.map(p => p.name+"|||"+(p.brand?.name||"")));
  const existingCodes = new Set((await prisma.product.findMany({ select:{ productCode:true } })).map(p=>p.productCode).filter(Boolean) as string[]);
  const existingSlugs = new Set((await prisma.product.findMany({ select:{ slug:true } })).map(p=>p.slug));

  function resolveCat(ec: string): string|null {
    const key = ec.toLowerCase().trim();
    const norm = CAT_MAP[key];
    if (norm) return catSlugMap.get(makeSlug(norm)) ?? null;
    return catSlugMap.get(makeSlug(ec)) ?? null;
  }

  const seen = new Set<string>();
  const toInsert: Prisma.ProductCreateManyInput[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = str(row["Product Name (Normalized)"]);
    if (!name) continue;
    const brand = str(row["Brand / Catalogue"]);
    const nb = BRAND_MAP[brand.toLowerCase()] || brand;
    const key = name+"|||"+nb;
    if (seen.has(key)) continue;
    seen.add(key);
    if (dbSet.has(key)) continue; // already in DB

    const brandId = brandMap.get(nb.toLowerCase()) ?? null;
    const categoryId = resolveCat(str(row["Category"]));
    const rawCode = str(row["Product Code / Art No."]);
    // Null out shared codes — they are colour codes, not unique product IDs
    const productCode = (rawCode && !sharedCodes.has(rawCode) && !existingCodes.has(rawCode)) ? rawCode : null;
    const catalogueMrp = decimal(row["Catalogue MRP"]);

    let slug = makeSlug(name);
    if (existingSlugs.has(slug)) slug = slug+"-"+String(i);
    let attempt = 0;
    while (existingSlugs.has(slug)) slug = makeSlug(name)+"-"+String(i)+"-"+(attempt++);
    existingSlugs.add(slug);

    toInsert.push({
      name, slug, productCode,
      brandId, categoryId,
      material: str(row["Material"])||null,
      capacity: str(row["Capacity"])||null,
      dimensions: str(row["Size / Dimensions"])||null,
      colourFinish: str(row["Colour / Finish"])||null,
      piecesPerSet: intVal(row["Pieces per Set"]),
      caseQty: intVal(row["Case / Carton Qty"]),
      collection: str(row["Collection / Series"])||null,
      subcategory: str(row["Subcategory"])||null,
      mrp: catalogueMrp, catalogueMrp,
      priceUnit: str(row["Price Unit"])||null,
      cataloguePage: str(row["Catalogue Page"])||null,
      sourceFile: str(row["Source File"])||null,
      reviewStatus: str(row["Review Status"])||null,
      nameVerified: boolVal(row["Product Name Source Verified"]),
      isFeatured: false,
      isNewArrival: boolVal(row["New Arrival"]),
      isActive: true, features: [],
    });
  }

  console.log("Products to insert:", toInsert.length);
  if (toInsert.length === 0) { console.log("Nothing to insert!"); return; }

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const chunk = toInsert.slice(i, i+50);
    try {
      const res = await prisma.product.createMany({ data: chunk, skipDuplicates: true });
      inserted += res.count;
      console.log("  Chunk "+(Math.floor(i/50)+1)+": "+res.count+"/"+chunk.length+" ("+inserted+" total)");
    } catch(err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("  Chunk "+(Math.floor(i/50)+1)+" FAILED: "+msg);
    }
  }

  const final = await prisma.product.count();
  console.log("\n=== FINAL MOPUP COMPLETE ===");
  console.log("Inserted:", inserted);
  console.log("Total in DB:", final);
}

main().catch(console.error).finally(() => prisma.$disconnect());