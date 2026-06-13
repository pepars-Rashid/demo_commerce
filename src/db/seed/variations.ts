import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "@/db/db";
import {
  productCategory,
  product,
  productItem,
  variation,
  variationOption,
  productConfiguration,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");

interface VariationsConfig {
  [categorySlug: string]: {
    sizes: string[];
    colors: { label: string; hex: string }[];
  };
}

/** Extract alphanumeric slug part from a value (strip #, keep only a-zA-Z0-9) */
function slugifyValue(val: string): string {
  return val.replace(/[^a-zA-Z0-9]/g, "");
}

/** Check if a string contains only English letters + digits */
function isEnglishOnly(val: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(val);
}

export async function seedVariations() {
  const config = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "variations-config.json"), "utf-8")
  ) as VariationsConfig;

  for (const [categorySlug, vars] of Object.entries(config)) {
    // ── 1. Find category ───────────────────────────────────────────────
    const [cat] = await db
      .select()
      .from(productCategory)
      .where(eq(productCategory.slug, categorySlug))
      .limit(1);

    if (!cat) {
      console.warn(`   ⚠ Category "${categorySlug}" not found, skipping variations`);
      continue;
    }

    // ── 2. Create variations ──────────────────────────────────────────
    // Size variation
    const [sizeVar] = await db
      .insert(variation)
      .values({ categoryId: cat.id, name: "Size" })
      .returning({ id: variation.id });

    // Color variation
    const [colorVar] = await db
      .insert(variation)
      .values({ categoryId: cat.id, name: "Color" })
      .returning({ id: variation.id });

    // ── 3. Create variation options ───────────────────────────────────
    const sizeOptionIds: number[] = [];
    for (const size of vars.sizes) {
      const [opt] = await db
        .insert(variationOption)
        .values({ variationId: sizeVar.id, value: size })
        .returning({ id: variationOption.id });
      sizeOptionIds.push(opt.id);
    }

    const colorOptionIds: number[] = [];
    for (const color of vars.colors) {
      const [opt] = await db
        .insert(variationOption)
        .values({ variationId: colorVar.id, value: color.hex })
        .returning({ id: variationOption.id });
      colorOptionIds.push(opt.id);
    }

    console.log(`   Created variations: Size (${sizeOptionIds.length} options), Color (${colorOptionIds.length} options)`);

    // ── 4. Find first product in this category ─────────────────────────
    const [firstProduct] = await db
      .select({ id: product.id })
      .from(product)
      .where(eq(product.categoryId, cat.id))
      .limit(1);

    if (!firstProduct) {
      console.warn(`   ⚠ No products found in "${categorySlug}", skipping`);
      continue;
    }

    // ── 5. Delete its original single product_item ─────────────────────
    const [oldItem] = await db
      .select({ id: productItem.id })
      .from(productItem)
      .where(eq(productItem.productId, firstProduct.id))
      .limit(1);

    if (oldItem) {
      await db.delete(productItem).where(eq(productItem.id, oldItem.id));
    }

    // ── 6. Generate variant SKUs for every size × color combination ────
    let variantCount = 0;

    for (let si = 0; si < vars.sizes.length; si++) {
      for (let ci = 0; ci < vars.colors.length; ci++) {
        const size = vars.sizes[si];
        const color = vars.colors[ci];
        const colorSlug = slugifyValue(color.hex);

        // Insert with null SKU → get ID → update SKU
        const [newItem] = await db
          .insert(productItem)
          .values({
            productId: firstProduct.id,
            sku: null,
            qtyInStock: Math.floor(Math.random() * 20) + 5, // 5–25
            price: "29.99",
            discountPrice: null,
            images: [],
            variantsJson: { Size: size, Color: color.hex },
          })
          .returning({ id: productItem.id });

        // Build SKU: categorySlug-productItemId-{size}-{colorHex}
        const sizePart = isEnglishOnly(size) ? size : String(si);
        const colorPart = isEnglishOnly(colorSlug) ? colorSlug : String(ci);
        const sku = `${categorySlug}-${newItem.id}-${sizePart}-${colorPart}`;

        await db
          .update(productItem)
          .set({ sku })
          .where(eq(productItem.id, newItem.id));

        // Insert product_configuration (junction) rows
        await db.insert(productConfiguration).values([
          { productItemId: newItem.id, variationOptionId: sizeOptionIds[si] },
          { productItemId: newItem.id, variationOptionId: colorOptionIds[ci] },
        ]);

        variantCount++;
      }
    }

    console.log(`   ✅ ${variantCount} variant items generated for first product in "${categorySlug}"`);
  }
}