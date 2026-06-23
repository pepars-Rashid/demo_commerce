import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "@/db/db";
import { productCategory, product, productItem } from "@/db/schema";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as T;
}

interface RawProduct {
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  thumbnail: string;
  images: string[];
  sku: string;
  stock: number;
}

// The 4 categories we seed products for
const CATEGORIES = [
  { slug: "beauty", name: "مستحضرات تجميل", parentSlug: null },
  { slug: "fragrances", name: "عطور", parentSlug: "beauty" },
  { slug: "skin-care", name: "العناية بالبشرة", parentSlug: "beauty" },
  { slug: "smartphones", name: "هواتف ذكية", parentSlug: null },
  { slug: "mobile-accessories", name: "إكسسوارات جوال", parentSlug: "smartphones" },
  { slug: "mens-shirts", name: "قمصان رجالية", parentSlug: null },
  { slug: "womens-dresses", name: "فساتين نسائية", parentSlug: null },
];

// Which product file maps to which slug
const PRODUCT_FILES: { file: string; slug: string }[] = [
  { file: "products-beauty.json", slug: "beauty" },
  { file: "products-mens-shirts.json", slug: "mens-shirts" },
  { file: "products-womens-dresses.json", slug: "womens-dresses" },
  { file: "products-smartphones.json", slug: "smartphones" },
];

export async function seedProducts() {
  // ── 1. Insert all 7 categories (parents first) ───────────────────────
  const slugToId = new Map<string, number>();

  // Parents (no parent)
  for (const cat of CATEGORIES.filter((c) => !c.parentSlug)) {
    const [row] = await db
      .insert(productCategory)
      .values({ categoryName: cat.name, slug: cat.slug, parentCategoryId: null, categoryImage: null })
      .returning({ id: productCategory.id });
    slugToId.set(cat.slug, row.id);
  }

  // Children
  for (const cat of CATEGORIES.filter((c) => c.parentSlug)) {
    const [row] = await db
      .insert(productCategory)
      .values({ categoryName: cat.name, slug: `${cat.parentSlug}/${cat.slug}`, parentCategoryId: slugToId.get(cat.parentSlug!) })
      .returning({ id: productCategory.id });
    slugToId.set(cat.slug, row.id);
  }

  console.log(`✅ ${CATEGORIES.length} categories seeded`);

  // ── 2. Insert products + items ───────────────────────────────────────
  let productCount = 0;
  let itemCount = 0;

  for (const { file, slug } of PRODUCT_FILES) {
    const { products: rawProducts } = readJson<{ products: RawProduct[] }>(file);
    const categoryId = slugToId.get(slug)!;

    for (const p of rawProducts) {
      const discountPrice = (p.price - (p.price * p.discountPercentage) / 100).toFixed(2);

      const [prod] = await db
        .insert(product)
        .values({ categoryId, name: p.title, description: p.description, basePrice: p.price.toFixed(2), totalStock: p.stock, productImage: p.thumbnail })
        .returning({ id: product.id });

      // Insert with null SKU → get serial ID → update SKU
      const [newItem] = await db
        .insert(productItem)
        .values({
          productId: prod.id,
          sku: null,
          qtyInStock: p.stock,
          price: p.price.toFixed(2),
          discountPrice,
          images: p.images,
          variantsJson: {},
        })
        .returning({ id: productItem.id });

      const sku = `${slug}-${newItem.id}`;
      await db
        .update(productItem)
        .set({ sku })
        .where(eq(productItem.id, newItem.id));

      productCount++;
      itemCount++;
    }
  }

  console.log(`✅ ${productCount} products seeded with ${itemCount} items`);
}