"use server";

import { db } from "@/db/db";
import {
  product as productTable,
  productItem as productItemTable,
  productCategory as productCategoryTable,
} from "@/db/schema";
import { eq, sql, ilike, count, and, asc, desc, inArray, isNull, notInArray, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/permissions";
import { productSchema } from "@/lib/zod/product";
import type { ProductFormValues } from "@/lib/zod/product";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProductListRow {
  id: number;
  name: string;
  description: string | null;
  basePrice: string;
  totalStock: number;
  productImage: string | null;
  categoryId: number;
  categoryName: string | null;
  categoryArchived: boolean;
  itemCount: number;
  createdAt: Date;
}

export interface ProductListResult {
  products: ProductListRow[];
  totalPages: number;
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ProductDetail {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  basePrice: string;
  totalStock: number;
  productImage: string | null;
  categoryName: string | null;
  items: ProductItemDetail[];
}

export interface ProductItemDetail {
  id: number;
  productId: number;
  sku: string | null;
  qtyInStock: number;
  reservedStock: number;
  price: string;
  discountPrice: string | null;
  images: string[];
  variantsJson: Record<string, string>;
 }

// ─── Auth helper ────────────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("غير مصرح");
  }
  if (!isAdmin(session.user.role)) {
    throw new Error("غير مصرح");
  }
  return session;
}

// Soft-delete product items: preserve history, hide from reads (deletedAt), and
// free each unique SKU by renaming it to `{sku}_DELETED_{id}` so a removed
// variant can later be re-added under the same SKU. Rows are never hard-deleted,
// so inventory_log references stay valid.
async function softDeleteItems(where: SQL) {
  await db
    .update(productItemTable)
    .set({
      deletedAt: sql`now()`,
      sku: sql`concat(coalesce(${productItemTable.sku}, ''), '_DELETED_', ${productItemTable.id})`,
    })
    .where(and(where, isNull(productItemTable.deletedAt)));
}

// ─── GET: Paginated product list ────────────────────────────────────────────

export async function getProducts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number | null;
}): Promise<ProductListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  // Build WHERE clauses
  const conditions = [isNull(productTable.deletedAt)];

  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(ilike(productTable.name, term));
  }

  if (params.categoryId != null) {
    conditions.push(eq(productTable.categoryId, params.categoryId));
  }

  const where = and(...conditions);

  // Count total matching products
  const [countResult] = await db
    .select({ value: count() })
    .from(productTable)
    .where(where);

  const totalCount = Number(countResult.value);
  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch paginated products with category name and item count
  const rows = await db
    .select({
      id: productTable.id,
      name: productTable.name,
      description: productTable.description,
      basePrice: productTable.basePrice,
      totalStock: productTable.totalStock,
      productImage: productTable.productImage,
      categoryId: productTable.categoryId,
      categoryName: productCategoryTable.categoryName,
      categoryArchived: sql<boolean>`${productCategoryTable.deletedAt} is not null`,
      createdAt: productTable.createdAt,
    })
    .from(productTable)
    .leftJoin(
      productCategoryTable,
      eq(productTable.categoryId, productCategoryTable.id),
    )
    .where(where)
    .orderBy(desc(productTable.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get item counts for all returned products
  const productIds = rows.map((r) => r.id);
  const itemCounts: Record<number, number> = {};

  if (productIds.length > 0) {
    const counts = await db
      .select({
        productId: productItemTable.productId,
        value: count(),
      })
      .from(productItemTable)
      .where(
        and(
          inArray(productItemTable.productId, productIds),
          isNull(productItemTable.deletedAt),
        ),
      )
      .groupBy(productItemTable.productId);

    for (const c of counts) {
      itemCounts[c.productId] = Number(c.value);
    }
  }

  const products = rows.map((r) => ({
    ...r,
    itemCount: itemCounts[r.id] ?? 0,
  }));

  return { products, totalPages, totalCount, page, pageSize };
}

// ─── GET: Single product with items ─────────────────────────────────────────

export async function getProductById(
  id: number,
): Promise<ProductDetail | null> {
  const [[prod], items] = await Promise.all([
    db
      .select({
        id: productTable.id,
        categoryId: productTable.categoryId,
        name: productTable.name,
        description: productTable.description,
        basePrice: productTable.basePrice,
        totalStock: productTable.totalStock,
        productImage: productTable.productImage,
        categoryName: productCategoryTable.categoryName,
      })
      .from(productTable)
      .leftJoin(
        productCategoryTable,
        eq(productTable.categoryId, productCategoryTable.id),
      )
      .where(and(eq(productTable.id, id), isNull(productTable.deletedAt)))
      .limit(1),
    db
      .select()
      .from(productItemTable)
      .where(
        and(
          eq(productItemTable.productId, id),
          isNull(productItemTable.deletedAt),
        ),
      )
      .orderBy(asc(productItemTable.id)),
  ]);

  if (!prod) return null;

  return {
    ...prod,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      sku: i.sku,
      qtyInStock: i.qtyInStock,
      reservedStock: i.reservedStock,
      price: i.price,
      discountPrice: i.discountPrice,
      images: i.images ?? [],
      variantsJson: (i.variantsJson ?? {}) as Record<string, string>,
    })),
  };
}

// ─── CREATE: Product + items ────────────────────────────────────────────────

export async function createProduct(data: ProductFormValues) {
  await assertAdmin();

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("بيانات غير صحيحة");
  }

  const { name, description, basePrice, productImage, categoryId, items } =
    parsed.data;

  const totalStock = items.reduce(
    (sum, item) => sum + Number(item.qtyInStock),
    0,
  );

  // Insert product
  const [newProduct] = await db
    .insert(productTable)
    .values({
      categoryId: Number(categoryId),
      name,
      description: description ?? null,
      basePrice: String(basePrice),
      totalStock,
      productImage: productImage ?? null,
    })
    .returning({ id: productTable.id });

  // Insert items (bulk)
  await db.insert(productItemTable).values(
    items.map((item) => ({
      productId: newProduct.id,
      sku: item.sku || null,
      qtyInStock: Number(item.qtyInStock),
      price: String(item.price),
      discountPrice:
        item.discountPrice != null ? String(item.discountPrice) : null,
      images: item.images ?? [],
      variantsJson:
        item.variants.length > 0 ? rowVariantsToJson(item.variants) : {},
    })),
  );

  revalidatePath("/profile/admin/products");
  return { success: true as const, id: newProduct.id };
}

// ─── UPDATE: Product + diff-based item merge (bulk, atomic) ─────────────────

export async function updateProduct(id: number, data: ProductFormValues) {
  await assertAdmin();

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("بيانات غير صحيحة");
  }
  const { name, description, basePrice, productImage, categoryId, items } =
    parsed.data;
  if (items.length === 0) {
    throw new Error("أضف متغيراً واحداً على الأقل");
  }

  const totalStock = items.reduce(
    (sum, item) => sum + Number(item.qtyInStock),
    0,
  );

  // Existing rows carry an id (threaded through the form); brand-new rows don't.
  const kept = items.filter((it) => it.id != null && it.id !== "");
  const keptIds = kept.map((it) => Number(it.id));
  const newItems = items.filter((it) => it.id == null || it.id === "");

  // ── Multi-column CASE WHEN: bulk-update kept rows in a single UPDATE ──
  const skuChunks: SQL[] = [sql`(case`];
  const qtyChunks: SQL[] = [sql`(case`];
  const priceChunks: SQL[] = [sql`(case`];
  const discountChunks: SQL[] = [sql`(case`];
  const imagesChunks: SQL[] = [sql`(case`];
  const variantsChunks: SQL[] = [sql`(case`];
  for (const item of kept) {
    const itemId = Number(item.id);
    // Bind with explicit PG casts: raw CASE-WHEN fragments lose the column
    // type, and text params aren't implicitly castable to int/numeric, so each
    // non-text value is cast explicitly (jsonb values sent as JSON strings).
    skuChunks.push(sql`when ${productItemTable.id} = ${itemId} then ${item.sku || null}`);
    qtyChunks.push(sql`when ${productItemTable.id} = ${itemId} then ${Number(item.qtyInStock)}::int`);
    priceChunks.push(sql`when ${productItemTable.id} = ${itemId} then ${String(item.price)}::numeric`);
    discountChunks.push(sql`when ${productItemTable.id} = ${itemId} then ${String(item.discountPrice != null ? item.discountPrice : null)}::numeric`);
    imagesChunks.push(sql`when ${productItemTable.id} = ${itemId} then ${JSON.stringify(item.images ?? [])}::jsonb`);
    variantsChunks.push(sql`when ${productItemTable.id} = ${itemId} then ${JSON.stringify(item.variants.length > 0 ? rowVariantsToJson(item.variants) : {})}::jsonb`);
  }
  skuChunks.push(sql`end)`);
  qtyChunks.push(sql`end)`);
  priceChunks.push(sql`end)`);
  discountChunks.push(sql`end)`);
  imagesChunks.push(sql`end)`);
  variantsChunks.push(sql`end)`);

  const combine = (chunks: SQL[]) => sql.join(chunks, sql.raw(" "));

  // ── One atomic batch ──
  const statements = [
    db.update(productTable)
      .set({
        categoryId: Number(categoryId),
        name,
        description: description ?? null,
        basePrice: String(basePrice),
        totalStock,
        productImage: productImage ?? null,
      })
      .where(eq(productTable.id, id)),

    // soft-delete removed items FIRST (frees their SKU before any insert below)
    db.update(productItemTable)
      .set({
        deletedAt: sql`now()`,
        sku: sql`concat(coalesce(${productItemTable.sku}, ''), '_DELETED_', ${productItemTable.id})`,
      })
      .where(
        and(
          eq(productItemTable.productId, id),
          isNull(productItemTable.deletedAt),
          keptIds.length > 0
            ? notInArray(productItemTable.id, keptIds)
            : undefined,
        ),
      ),

    ...(keptIds.length > 0
      ? [
          db.update(productItemTable)
            .set({
              sku: combine(skuChunks),
              qtyInStock: combine(qtyChunks),
              price: combine(priceChunks),
              discountPrice: combine(discountChunks),
              images: combine(imagesChunks),
              variantsJson: combine(variantsChunks),
            })
            .where(and(inArray(productItemTable.id, keptIds), isNull(productItemTable.deletedAt))),
        ]
      : []),

    ...(newItems.length > 0
      ? [
          db.insert(productItemTable).values(
            newItems.map((item) => ({
              productId: id,
              sku: item.sku || null,
              qtyInStock: Number(item.qtyInStock),
              price: String(item.price),
              discountPrice:
                item.discountPrice != null ? String(item.discountPrice) : null,
              images: item.images ?? [],
              variantsJson:
                item.variants.length > 0 ? rowVariantsToJson(item.variants) : {},
            })),
          ),
        ]
      : []),
  ];

  type BatchStatement = (typeof statements)[number];
  await db.batch(
    statements as unknown as Readonly<[BatchStatement, ...BatchStatement[]]>,
  );

  revalidatePath("/profile/admin/products");
  revalidatePath(`/profile/admin/products/${id}`);
  return { success: true as const, id };
}

// ─── DELETE: Soft delete single product ─────────────────────────────────────

export async function deleteProduct(id: number) {
  await assertAdmin();

  await db
    .update(productTable)
    .set({ deletedAt: sql`now()` })
    .where(eq(productTable.id, id));

  // Also soft-delete its items (frees their unique SKUs via the helper)
  await softDeleteItems(eq(productItemTable.productId, id));

  revalidatePath("/profile/admin/products");
}

// ─── DELETE: Batch soft delete ──────────────────────────────────────────────

export async function batchDeleteProducts(ids: number[]) {
  await assertAdmin();

  await db
    .update(productTable)
    .set({ deletedAt: sql`now()` })
    .where(inArray(productTable.id, ids));

  // Bulk soft-delete all items for the given products (frees their unique SKUs)
  await softDeleteItems(inArray(productItemTable.productId, ids));

  revalidatePath("/profile/admin/products");
}

// ─── Helper: Convert form variant rows to JSON ──────────────────────────────

function rowVariantsToJson(
  rows: { key?: string; value?: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const r of rows) {
    if (r.key && r.value) {
      result[r.key] = r.value;
    }
  }
  return result;
}

// ─── GET: All categories (for dropdowns) ────────────────────────────────────
// `includeArchived` lets the product list filter (and the edit form) surface
// categories under an archived (soft-deleted) category. Each row carries an
// `archived` flag so the UI can tag it accordingly.

export async function getProductCategories(includeArchived = false) {
  const base = db
    .select({
      id: productCategoryTable.id,
      parentCategoryId: productCategoryTable.parentCategoryId,
      categoryName: productCategoryTable.categoryName,
      slug: productCategoryTable.slug,
      categoryImage: productCategoryTable.categoryImage,
      archived: sql<boolean>`${productCategoryTable.deletedAt} is not null`,
    })
    .from(productCategoryTable);

  const query = includeArchived
    ? base
    : base.where(isNull(productCategoryTable.deletedAt));

  return query.orderBy(asc(productCategoryTable.categoryName));
}
