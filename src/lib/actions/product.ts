"use server";

import { db } from "@/db/db";
import {
  product as productTable,
  productItem as productItemTable,
  productCategory as productCategoryTable,
} from "@/db/schema";
import { eq, sql, like, count, and, asc, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
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
  // role is cached in JWT token
  if (session.user.role !== "superAdmin") {
    throw new Error("غير مصرح");
  }
  return session;
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
  const conditions = [sql`${productTable.deletedAt} is null`];

  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(like(productTable.name, term));
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
          sql`${productItemTable.deletedAt} is null`,
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
  const [prod] = await db
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
    .where(and(eq(productTable.id, id), sql`${productTable.deletedAt} is null`))
    .limit(1);

  if (!prod) return null;

  const items = await db
    .select()
    .from(productItemTable)
    .where(
      and(
        eq(productItemTable.productId, id),
        sql`${productItemTable.deletedAt} is null`,
      ),
    )
    .orderBy(asc(productItemTable.id));

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

  // Insert items
  for (const item of items) {
    await db.insert(productItemTable).values({
      productId: newProduct.id,
      sku: item.sku || null,
      qtyInStock: Number(item.qtyInStock),
      price: String(item.price),
      discountPrice: item.discountPrice != null ? String(item.discountPrice) : null,
      variantsJson: item.variants.length > 0 ? rowVariantsToJson(item.variants) : {},
    });
  }

  revalidatePath("/profile/admin/products");
  redirect("/profile/admin/products");
}

// ─── UPDATE: Product + replace items ────────────────────────────────────────

export async function updateProduct(id: number, data: ProductFormValues) {
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

  // Update product
  await db
    .update(productTable)
    .set({
      categoryId: Number(categoryId),
      name,
      description: description ?? null,
      basePrice: String(basePrice),
      totalStock,
      productImage: productImage ?? null,
    })
    .where(eq(productTable.id, id));

  // Delete old items (hard delete — they're not soft-deletable per schema)
  await db
    .delete(productItemTable)
    .where(eq(productItemTable.productId, id));

  // Insert new items
  for (const item of items) {
    await db.insert(productItemTable).values({
      productId: id,
      sku: item.sku || null,
      qtyInStock: Number(item.qtyInStock),
      price: String(item.price),
      discountPrice: item.discountPrice != null ? String(item.discountPrice) : null,
      variantsJson: item.variants.length > 0 ? rowVariantsToJson(item.variants) : {},
    });
  }

  revalidatePath("/profile/admin/products");
  revalidatePath(`/profile/admin/products/${id}`);
  redirect("/profile/admin/products");
}

// ─── DELETE: Soft delete single product ─────────────────────────────────────

export async function deleteProduct(id: number) {
  await assertAdmin();

  await db
    .update(productTable)
    .set({ deletedAt: new Date() })
    .where(eq(productTable.id, id));

  // Also soft-delete its items
  await db
    .update(productItemTable)
    .set({ deletedAt: new Date() })
    .where(eq(productItemTable.productId, id));

  revalidatePath("/profile/admin/products");
}

// ─── DELETE: Batch soft delete ──────────────────────────────────────────────

export async function batchDeleteProducts(ids: number[]) {
  await assertAdmin();

  const now = new Date();

  await db
    .update(productTable)
    .set({ deletedAt: now })
    .where(inArray(productTable.id, ids));

  for (const id of ids) {
    await db
      .update(productItemTable)
      .set({ deletedAt: now })
      .where(eq(productItemTable.productId, id));
  }

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

export async function getProductCategories() {
  const categories = await db
    .select({
      id: productCategoryTable.id,
      parentCategoryId: productCategoryTable.parentCategoryId,
      categoryName: productCategoryTable.categoryName,
      slug: productCategoryTable.slug,
      categoryImage: productCategoryTable.categoryImage,
    })
    .from(productCategoryTable)
    .where(sql`${productCategoryTable.deletedAt} is null`)
    .orderBy(asc(productCategoryTable.categoryName));

  return categories;
}
