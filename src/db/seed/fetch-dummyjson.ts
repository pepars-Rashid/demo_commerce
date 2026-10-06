import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const CATEGORY_LIST_URL = "https://dummyjson.com/products/category-list";

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// Fields we pull from DummyJSON products (a superset of what our schema needs).
export interface DummyProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  sku: string;
  thumbnail: string;
  images: string[];
}

export interface DummyCache {
  fetchedAt: string;
  categories: string[]; // every DummyJSON category slug
  productsBySlug: Record<string, DummyProduct[]>;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function fetchWithRetry<T>(url: string, retries = 1): Promise<T> {
  try {
    return await getJson<T>(url);
  } catch (err) {
    if (retries <= 0) throw err;
    await sleep(2000);
    return fetchWithRetry<T>(url, retries - 1);
  }
}

/**
 * Stage 1 (data acquisition): fetch the full DummyJSON catalog + write a
 * timestamped raw cache to `data/dummyjson-{ts}.json`.
 * Respects DummyJSON's ~1 req/sec limit with a 1s sleep between category calls.
 */
export async function fetchDummyJson(): Promise<DummyCache> {
  console.log("🌐 Fetching DummyJSON catalog...\n");

  const categories = await fetchWithRetry<string[]>(CATEGORY_LIST_URL);
  console.log(`   ${categories.length} categories found:`);
  for (const c of categories) console.log(`     - ${c}`);

  const productsBySlug: Record<string, DummyProduct[]> = {};
  for (let i = 0; i < categories.length; i++) {
    const slug = categories[i];
    await sleep(1000); // 1 req/sec
    try {
      const { products } = await fetchWithRetry<{ products: DummyProduct[] }>(
        `https://dummyjson.com/products/category/${slug}`
      );
      productsBySlug[slug] = products ?? [];
      console.log(`   [${i + 1}/${categories.length}] ${slug}: ${products?.length ?? 0} products`);
    } catch (err) {
      console.warn(`   ⚠ ${slug}: fetch failed (${err instanceof Error ? err.message : err}). Skipping.`);
      productsBySlug[slug] = [];
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const payload: DummyCache = { fetchedAt: new Date().toISOString(), categories, productsBySlug };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `dummyjson-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log(`\n💾 Cached raw data → ${file}`);
  return payload;
}

/** Print a per-category overview (count, price/stock ranges, samples). */
export function printManifest(cache: DummyCache): void {
  console.log("\n📋 Inventory manifest");
  console.log("  " + "-".repeat(110));
  let total = 0;
  for (const slug of cache.categories) {
    const products = cache.productsBySlug[slug] ?? [];
    total += products.length;
    if (products.length === 0) {
      console.log(`  ${slug.padEnd(20)} ${"0".padStart(3)}`);
      continue;
    }
    const prices = products.map((p) => p.price);
    const stocks = products.map((p) => p.stock);
    const samples = products
      .slice(0, 3)
      .map((p) => p.title)
      .join(", ");
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))]
      .slice(0, 3)
      .join(", ");
    console.log(
      `  ${slug.padEnd(20)} ${String(products.length).padStart(3)}  ·` +
        ` $${Math.min(...prices).toFixed(2)}–$${Math.max(...prices).toFixed(2)} ·` +
        ` stock ${Math.min(...stocks)}–${Math.max(...stocks)} · ${samples}` +
        (brands ? ` (${brands})` : "")
    );
  }
  console.log("  " + "-".repeat(110));
  console.log(`\n  TOTAL products ≈ ${total} across ${cache.categories.length} categories`);
}

/**
 * Load the most recently cached DummyJSON dump (prefer `fetchDummyJson` output).
 */
export function loadLatestDummyCache(): DummyCache {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^dummyjson-.*\.json$/.test(f))
    .sort();
  if (files.length === 0) {
    throw new Error(
      "No DummyJSON cache found in src/db/seed/data. Run the fetcher (fetch-dummyjson.ts) first."
    );
  }
  const file = path.join(DATA_DIR, files[files.length - 1]);
  console.log(`📂 Using cached DummyJSON → ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf-8")) as DummyCache;
}

// Run standalone: npx tsx src/db/seed/fetch-dummyjson.ts
const isMain =
  process.argv[1] != null && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  fetchDummyJson()
    .then((cache) => {
      printManifest(cache);
    })
    .catch((err) => {
      console.error("❌ Stage 1 fetcher failed:", err);
      process.exit(1);
    });
}