import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import {
  product as productTable,
  productItem as productItemTable,
  variation as variationTable,
  variationOption as variationOptionTable,
  productConfiguration as productConfigurationTable,
} from "@/db/schema";
import { collectLeaves, type VariantDim } from "./catalog-config";
import { loadLatestDummyCache } from "./fetch-dummyjson";

export interface CatalogItem {
  id: number;
  productId: number;
  dummyId: number;
  sku: string;
  price: string;
  discountPrice: string | null;
  qtyInStock: number;
  productName: string;
  categoryId: number;
}

interface Combo {
  json: Record<string, string>;
  slug: string;
}

const slugify = (v: string) => v.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

/** Cartesian product of variant dimensions, in a stable order. */
function combosOf(dims: VariantDim[]): Combo[] {
  let acc: Combo[] = [{ json: {}, slug: "" }];
  for (const dim of dims) {
    const next: Combo[] = [];
    for (const cur of acc) {
      for (const value of dim.values) {
        next.push({
          json: { ...cur.json, [dim.name]: value },
          slug: cur.slug ? `${cur.slug}-${slugify(value)}` : slugify(value),
        });
      }
    }
    acc = next;
  }
  return acc;
}

/** Split a product's total stock across n SKUs (each ≥ 0, exact sum). */
function splitStock(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const rem = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

/**
 * Seed products + variant items + normalized variation tables from the cached
 * DummyJSON dump. Returns every created item for downstream order/log seeding.
 */
export async function seedProducts(
  leafIdByPath: Map<string, number>
): Promise<CatalogItem[]> {
  const cache = loadLatestDummyCache();
  const items: CatalogItem[] = [];

  for (const leaf of collectLeaves()) {
    const categoryId = leafIdByPath.get(leaf.path);
    if (!categoryId) {
      console.log(`   ⚠ No category row for "${leaf.path}", skipping`);
      continue;
    }

    const pool = cache.productsBySlug[leaf.dummySlug] ?? [];
    const allCombos = combosOf(leaf.dims);

    // ── Variation tables (once per leaf) ──────────────────────────────
    // Map dimName + "::" + value → variationOption id.
    const optionIdByVal = new Map<string, number>();
    for (const dim of leaf.dims) {
      const [varRow] = await db
        .insert(variationTable)
        .values({ categoryId, name: dim.name })
        .returning({ id: variationTable.id });
      for (const value of dim.values) {
        const [optRow] = await db
          .insert(variationOptionTable)
          .values({ variationId: varRow.id, value })
          .returning({ id: variationOptionTable.id });
        optionIdByVal.set(`${dim.name}::${value}`, optRow.id);
      }
    }

    // ── Products in this leaf ─────────────────────────────────────────
    let comboOffset = 0;
    for (let pi = 0; pi < leaf.picks.length; pi++) {
      const dummyId = leaf.picks[pi];
      const p = pool.find((x) => x.id === dummyId);
      if (!p) {
        console.log(`   ⚠ DummyJSON product ${dummyId} not in "${leaf.dummySlug}"`);
        continue;
      }

      const n = leaf.skuCounts[pi] ?? 1;
      const chosen: Combo[] = [];
      for (let k = 0; k < n; k++) {
        chosen.push(allCombos[(comboOffset + k) % allCombos.length]);
      }
      comboOffset += n;

      const [prod] = await db
        .insert(productTable)
        .values({
          categoryId,
          name: p.title,
          description: p.description,
          basePrice: p.price.toFixed(2),
          totalStock: p.stock,
          productImage: p.thumbnail,
        })
        .returning({ id: productTable.id });

      const stockSplit = splitStock(p.stock, n);
      const discount = (p.price * (1 - p.discountPercentage / 100)).toFixed(2);

      const saved: { id: number; combo: Combo; qty: number }[] = [];
      for (let k = 0; k < n; k++) {
        const [item] = await db
          .insert(productItemTable)
          .values({
            productId: prod.id,
            sku: null,
            qtyInStock: stockSplit[k],
            reservedStock: 0,
            price: p.price.toFixed(2),
            discountPrice: discount,
            images: [],
            variantsJson: chosen[k].json,
          })
          .returning({ id: productItemTable.id });
        saved.push({ id: item.id, combo: chosen[k], qty: stockSplit[k] });
      }

      // Unique SKU per item: "{comboSlug}-{dummyId}".
      for (const si of saved) {
        const sku = `${si.combo.slug}-${dummyId}`;
        await db
          .update(productItemTable)
          .set({ sku })
          .where(eq(productItemTable.id, si.id));
      }

      // Junction rows: item ↔ variation option.
      for (const si of saved) {
        const junc: { productItemId: number; variationOptionId: number }[] = [];
        for (const [dimName, value] of Object.entries(si.combo.json)) {
          const optId = optionIdByVal.get(`${dimName}::${value}`);
          if (optId) junc.push({ productItemId: si.id, variationOptionId: optId });
        }
        if (junc.length > 0) {
          await db.insert(productConfigurationTable).values(junc);
        }
      }

      // Gallery: only assign images to the first item of each distinct
      // color/shade (just the first item when no color dim), so the same
      // gallery is not duplicated across size/ram-only splits.
      const colorDim = leaf.dims.find((d) => d.name === "Color" || d.name === "Shade");
      if (colorDim) {
        const seen = new Set<string>();
        for (const si of saved) {
          const val = si.combo.json[colorDim.name];
          if (val && !seen.has(val)) {
            seen.add(val);
            await db
              .update(productItemTable)
              .set({ images: p.images })
              .where(eq(productItemTable.id, si.id));
          }
        }
      } else if (saved.length > 0) {
        await db
          .update(productItemTable)
          .set({ images: p.images })
          .where(eq(productItemTable.id, saved[0].id));
      }

      for (const si of saved) {
        items.push({
          id: si.id,
          productId: prod.id,
          dummyId,
          sku: `${si.combo.slug}-${dummyId}`,
          price: p.price.toFixed(2),
          discountPrice: discount,
          qtyInStock: si.qty,
          productName: p.title,
          categoryId,
        });
      }
    }
  }

  console.log(`✅ ${items.length} product items seeded`);
  return items;
}