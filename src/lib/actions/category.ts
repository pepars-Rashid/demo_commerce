"use server";

import { db } from "@/db/db";
import {
  productCategory as productCategoryTable,
  product as productTable,
} from "@/db/schema";
import {
  eq,
  sql,
  ilike,
  count,
  and,
  inArray,
  isNull,
  isNotNull,
  desc,
  asc,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/permissions";
import { categorySchema } from "@/lib/zod/category";
import type { CategoryFormValues } from "@/lib/zod/category";

// Self-join alias for the parent relationship.
const parent = alias(productCategoryTable, "parent");

// Maximum depth of the category tree (Level 1 → Level 2 → Level 3).
// Validation and client precheck rely on this fixed cap.
const MAX_DEPTH = 3;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CategoryListRow {
  id: number;
  categoryName: string;
  slug: string;
  categoryImage: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  productCount: number;
  childCount: number;
  createdAt: Date;
}

export interface CategoryListResult {
  categories: CategoryListRow[];
  totalPages: number;
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CategoryDetail {
  id: number;
  categoryName: string;
  slug: string;
  categoryImage: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  productCount: number;
  childCount: number;
}

// ─── Auth helper ────────────────────────────────────────────────────────────
// Product + category CRUD is open to both admin roles (op-manager & super-admin).
async function assertCanManageCatalog() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("غير مصرح");
  }
  if (!isAdmin(session.user.role)) {
    throw new Error("غير مصرح");
  }
  return session;
}

// ─── GET: Paginated category list ───────────────────────────────────────────

export async function getCategories(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  onlyArchived?: boolean;
}): Promise<CategoryListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [
    params.onlyArchived
      ? isNotNull(productCategoryTable.deletedAt)
      : isNull(productCategoryTable.deletedAt),
  ];
  if (params.search) {
    conditions.push(ilike(productCategoryTable.categoryName, `%${params.search}%`));
  }

  const [countResult] = await db
    .select({ value: count() })
    .from(productCategoryTable)
    .where(and(...conditions));

  const totalCount = Number(countResult.value);
  const totalPages = Math.ceil(totalCount / pageSize);

  const rows = await db
    .select({
      id: productCategoryTable.id,
      categoryName: productCategoryTable.categoryName,
      slug: productCategoryTable.slug,
      categoryImage: productCategoryTable.categoryImage,
      parentCategoryId: productCategoryTable.parentCategoryId,
      parentCategoryName: parent.categoryName,
      createdAt: productCategoryTable.createdAt,
    })
    .from(productCategoryTable)
    .leftJoin(parent, eq(productCategoryTable.parentCategoryId, parent.id))
    .where(and(...conditions))
    .orderBy(desc(productCategoryTable.createdAt))
    .limit(pageSize)
    .offset(offset);

  const ids = rows.map((r) => r.id);
  const productCounts: Record<number, number> = {};
  const childCounts: Record<number, number> = {};

  if (ids.length > 0) {
    const prod = await db
      .select({
        categoryId: productTable.categoryId,
        value: count(),
      })
      .from(productTable)
      .where(
        and(
          inArray(productTable.categoryId, ids),
          isNull(productTable.deletedAt),
        ),
      )
      .groupBy(productTable.categoryId);
    for (const r of prod) productCounts[r.categoryId] = Number(r.value);

    const children = await db
      .select({
        parentId: parent.parentCategoryId,
        value: count(),
      })
      .from(parent)
      .where(
        and(
          inArray(parent.parentCategoryId, ids),
          isNull(parent.deletedAt),
        ),
      )
      .groupBy(parent.parentCategoryId);
    for (const r of children) {
      const pid = r.parentId;
      if (pid !== null) childCounts[pid] = Number(r.value);
    }
  }

  const categories = rows.map((r) => ({
    id: r.id,
    categoryName: r.categoryName,
    slug: r.slug,
    categoryImage: r.categoryImage,
    parentCategoryId: r.parentCategoryId,
    parentCategoryName: r.parentCategoryName,
    productCount: productCounts[r.id] ?? 0,
    childCount: childCounts[r.id] ?? 0,
    createdAt: r.createdAt,
  }));

  return { categories, totalPages, totalCount, page, pageSize };
}

// ─── GET: Active categories for the parent Select ───────────────────────────

export async function getActiveCategories(): Promise<
  { id: number; categoryName: string; parentCategoryId: number | null }[]
> {
  return db
    .select({
      id: productCategoryTable.id,
      categoryName: productCategoryTable.categoryName,
      parentCategoryId: productCategoryTable.parentCategoryId,
    })
    .from(productCategoryTable)
    .where(isNull(productCategoryTable.deletedAt))
    .orderBy(asc(productCategoryTable.categoryName));
}

// ─── GET: Single category ───────────────────────────────────────────────────

export async function getCategoryById(
  id: number,
): Promise<CategoryDetail | null> {
  const [row] = await db
    .select({
      id: productCategoryTable.id,
      categoryName: productCategoryTable.categoryName,
      slug: productCategoryTable.slug,
      categoryImage: productCategoryTable.categoryImage,
      parentCategoryId: productCategoryTable.parentCategoryId,
      parentCategoryName: parent.categoryName,
    })
    .from(productCategoryTable)
    .leftJoin(parent, eq(productCategoryTable.parentCategoryId, parent.id))
    .where(eq(productCategoryTable.id, id))
    .limit(1);

  if (!row) return null;

  const [productRes, childRes] = await Promise.all([
    db
      .select({ value: count() })
      .from(productTable)
      .where(and(eq(productTable.categoryId, id), isNull(productTable.deletedAt))),
    db
      .select({ value: count() })
      .from(parent)
      .where(and(eq(parent.parentCategoryId, id), isNull(parent.deletedAt))),
  ]);

  return {
    id: row.id,
    categoryName: row.categoryName,
    slug: row.slug,
    categoryImage: row.categoryImage,
    parentCategoryId: row.parentCategoryId,
    parentCategoryName: row.parentCategoryName,
    productCount: Number(productRes[0].value),
    childCount: Number(childRes[0].value),
  };
}

// ─── GET: Category + all descendants (own-subtree closure) ────────────────
// Used to exclude an edited category and its subtree from the parent Select,
// preventing self-parenting / reference cycles.
//
// Max depth is 3, so a level-by-level walk needs at most 2 small indexed
// queries after the root — far cheaper than loading the whole table into
// memory (as before) or an unnecessary recursive CTE / 3-alias join.

export async function getCategoryWithDescendants(id: number): Promise<Set<number>> {
  const set = new Set<number>([id]);
  let frontier = [id];

  for (let depth = 0; depth < 2 && frontier.length > 0; depth++) {
    const children = await db
      .select({ id: productCategoryTable.id })
      .from(productCategoryTable)
      .where(
        and(
          inArray(productCategoryTable.parentCategoryId, frontier),
          isNull(productCategoryTable.deletedAt),
        ),
      );

    frontier = children.map((c) => c.id);
    for (const c of frontier) set.add(c);
  }
  return set;
}

// ─── CREATE ─────────────────────────────────────────────────────────────────

export async function createCategory(data: CategoryFormValues) {
  await assertCanManageCatalog();

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("بيانات غير صحيحة");
  }

  const { categoryName, slug, parentCategoryId, categoryImage } = parsed.data;

  // Slug is unique across ALL rows (incl. soft-deleted) — check upfront.
  const existing = await db
    .select({ id: productCategoryTable.id })
    .from(productCategoryTable)
    .where(eq(productCategoryTable.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return { error: "slug_taken" as const };
  }

  // Add parent validation right after the slug check, before the insert.
  if (parentCategoryId) {
    const result = await validateParent(null, Number(parentCategoryId));
    if (result !== "ok") return { error: result };
  }

  const [row] = await db
    .insert(productCategoryTable)
    .values({
      categoryName,
      slug,
      parentCategoryId: parentCategoryId ? Number(parentCategoryId) : null,
      categoryImage: categoryImage || null,
    })
    .returning({ id: productCategoryTable.id });

  revalidatePath("/profile/admin/categories");
  revalidatePath("/profile/admin/products");
  return { success: true as const, id: row.id };
}

// ─── Parent validator: merged cycle + max-depth guard ────────────────────────
// Walks UP from the proposed parent to find (a) whether moving under it creates
// a cycle and (b) how deep the new subtree would reach. Returns:
//   "cycle"     → id appears in the ancestor chain (illegal)
//   "max_depth" → the moved node's subtree would exceed MAX_DEPTH
//   "ok"        → safe to parent under newParentId
//
// Two walks, both bounded for a fixed-depth tree:
//   1. UP (≤ MAX_DEPTH-1 hops) from the proposed parent → its level + cycle check.
//   2. DOWN (≤ MAX_DEPTH-1 hops) from the moved node → height of its own subtree.
// The moved subtree inherits the parent's level, so the deepest node sits at
// (new parent level + 1 + subtree height) and must stay ≤ MAX_DEPTH. A single
// upstream walk alone is NOT enough — it would miss a moved node that carries
// children/grandchildren. Still ≤ a handful of small indexed lookups, no
// recursion, no transactions.

async function validateParent(
  id: number | null,        // null on create (no existing subtree to inherit)
  newParentId: number,
): Promise<"ok" | "cycle" | "max_depth"> {
  if (id !== null && id === newParentId) return "cycle";

  // Upward walk: detect cycle + measure the proposed parent's level.
  let currentId: number | null = newParentId;
  let parentLevel = 1; // the proposed parent itself is level 1 of the walk
  const visited = new Set<number>();

  for (let hop = 0; hop < MAX_DEPTH - 1 && currentId != null; hop++) {
    if (id !== null && currentId === id) return "cycle";
    if (visited.has(currentId)) break; // pre-existing cycle, bail
    visited.add(currentId);

    const [row] = await db
      .select({ parentId: productCategoryTable.parentCategoryId })
      .from(productCategoryTable)
      .where(eq(productCategoryTable.id, currentId))
      .limit(1);

    currentId = row?.parentId ?? null;
    if (currentId != null) parentLevel++;
  }

  // Subtree height under the moved node (0 when creating a fresh root child).
  const heightBelow = id === null ? 0 : await subtreeHeightBelow(id);

  // Deepest node after the move sits at parentLevel + 1 (this node) + heightBelow.
  if (parentLevel + 1 + heightBelow > MAX_DEPTH) return "max_depth";

  return "ok";
}

// Number of levels of descendants directly under `id` (0 for a leaf).
// Bounded: a valid tree is ≤ MAX_DEPTH deep, so this visits at most MAX_DEPTH-1
// child levels — one small indexed query each, no recursion.
async function subtreeHeightBelow(id: number): Promise<number> {
  let height = 0;
  let frontier = [id];

  for (let depth = 0; depth < MAX_DEPTH - 1 && frontier.length > 0; depth++) {
    const children = await db
      .select({ id: productCategoryTable.id })
      .from(productCategoryTable)
      .where(
        and(
          inArray(productCategoryTable.parentCategoryId, frontier),
          isNull(productCategoryTable.deletedAt),
        ),
      );

    frontier = children.map((c) => c.id);
    if (frontier.length > 0) height++;
  }

  return height;
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────

export async function updateCategory(id: number, data: CategoryFormValues) {
  await assertCanManageCatalog();

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("بيانات غير صحيحة");
  }

  const { categoryName, slug, parentCategoryId, categoryImage } = parsed.data;

  const existing = await db
    .select({ id: productCategoryTable.id })
    .from(productCategoryTable)
    .where(
      and(
        eq(productCategoryTable.slug, slug),
        sql`${productCategoryTable.id} != ${id}`,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: "slug_taken" as const };
  }

  // Defense-in-depth: block self / ancestor / max-depth parenting.
  if (parentCategoryId) {
    const result = await validateParent(id, Number(parentCategoryId));
    if (result !== "ok") return { error: result };
  }

  await db
    .update(productCategoryTable)
    .set({
      categoryName,
      slug,
      parentCategoryId: parentCategoryId ? Number(parentCategoryId) : null,
      categoryImage: categoryImage || null,
    })
    .where(eq(productCategoryTable.id, id));

  revalidatePath("/profile/admin/categories");
  revalidatePath("/profile/admin/products");
  return { success: true as const, id };
}

// ─── DELETE: Soft delete (Inherited Invisibility — products untouched) ─────

export async function deleteCategory(id: number) {
  await assertCanManageCatalog();

  await db
    .update(productCategoryTable)
    .set({ deletedAt: sql`now()` })
    .where(eq(productCategoryTable.id, id));

  revalidatePath("/profile/admin/categories");
}

// ─── RESTORE ────────────────────────────────────────────────────────────────

export async function restoreCategory(id: number) {
  await assertCanManageCatalog();

  await db
    .update(productCategoryTable)
    .set({ deletedAt: null })
    .where(eq(productCategoryTable.id, id));

  revalidatePath("/profile/admin/categories");
  revalidatePath("/profile/admin/products");
}

// ─── DELETE: Batch soft delete ──────────────────────────────────────────────

export async function batchDeleteCategories(ids: number[]) {
  await assertCanManageCatalog();

  if (ids.length === 0) return;

  await db
    .update(productCategoryTable)
    .set({ deletedAt: sql`now()` })
    .where(inArray(productCategoryTable.id, ids));

  revalidatePath("/profile/admin/categories");
}
