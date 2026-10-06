"use server";

import { db } from "@/db/db";
import {
  inventoryLog as inventoryLogTable,
  orderLine as orderLineTable,
  product as productTable,
  productCategory as productCategoryTable,
  productItem as productItemTable,
  shopOrder as shopOrderTable,
  orderStatusEnum,
  users as usersTable,
  type OrderStatus,
} from "@/db/schema";
import { and, count, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { auth } from "@/lib/auth/auth";
import type { Session } from "next-auth";
import { isAdmin } from "@/lib/auth/permissions";

/** Read access — any admin role (mirrors order.ts / inventory.ts). */
async function assertIsAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    throw new Error("غير مصرح");
  }
  return session;
}

export interface KpiStats {
  products: number;
  orders: number;
  revenue: string;
  users: number;
}

export interface BestSellerRow {
  productId: number;
  name: string;
  units: number;
  revenue: string;
}

export interface OrdersByStatusRow {
  status: OrderStatus;
  revenue: string;
  count: number;
}

export interface InventoryByReasonRow {
  reason: string;
  magnitude: number;
  pct: number;
  stockIn: number;
  stockOut: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategoryNodeStat {
  id: number;
  name: string;
  productCount: number;
  pct: number;
}

export interface CategoryTreeStats {
  roots: CategoryNodeStat[];
  childrenByRoot: Record<number, CategoryNodeStat[]>;
}

// ─── 1. KPI stats (light — minutes) ──────────────────────────────────────────

async function getKpiStatsCached(): Promise<KpiStats> {
  "use cache";
  cacheLife("minutes");

  const [p] = await db
    .select({ value: count() })
    .from(productTable)
    .where(isNull(productTable.deletedAt));
  const [o] = await db
    .select({ value: count() })
    .from(shopOrderTable)
    .where(isNull(shopOrderTable.deletedAt));
  const [r] = await db
    .select({
      value: sql<string>`COALESCE(SUM(${shopOrderTable.orderTotal}), 0)::text`,
    })
    .from(shopOrderTable)
    .where(
      and(
        isNull(shopOrderTable.deletedAt),
        ne(shopOrderTable.orderStatus, "cancelled"),
      ),
    );
  const [u] = await db.select({ value: count() }).from(usersTable);

  return {
    products: Number(p.value),
    orders: Number(o.value),
    revenue: String(r.value),
    users: Number(u.value),
  };
}

export async function getKpiStats(): Promise<KpiStats> {
  await assertIsAdmin();
  return getKpiStatsCached();
}


// ─── 2. Best sellers top N by revenue (heavy — days) ─────────────────────────

async function getBestSellersCached(limit: number): Promise<BestSellerRow[]> {
  "use cache";
  cacheLife("days");

  const rows = await db
    .select({
      productId: productTable.id,
      name: productTable.name,
      units: sql<number>`SUM(${orderLineTable.qty})::int`,
      revenue: sql<string>`SUM(${orderLineTable.qty} * ${orderLineTable.price})::text`,
    })
    .from(orderLineTable)
    .innerJoin(shopOrderTable, eq(orderLineTable.orderId, shopOrderTable.id))
    .innerJoin(
      productItemTable,
      eq(orderLineTable.productItemId, productItemTable.id),
    )
    .innerJoin(productTable, eq(productItemTable.productId, productTable.id))
    .where(
      and(
        isNull(shopOrderTable.deletedAt),
        ne(shopOrderTable.orderStatus, "cancelled"),
        isNull(productTable.deletedAt),
      ),
    )
    .groupBy(productTable.id, productTable.name)
    .orderBy(desc(sql`SUM(${orderLineTable.qty} * ${orderLineTable.price})`))
    .limit(limit);

  return rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    units: Number(r.units),
    revenue: String(r.revenue),
  }));
}

export async function getBestSellers(limit = 5): Promise<BestSellerRow[]> {
  await assertIsAdmin();
  return getBestSellersCached(Math.min(10, Math.max(1, limit)));
}

// ─── 3. Orders grouped by status (heavy — days) ──────────────────────────────

async function getOrdersByStatusCached(): Promise<OrdersByStatusRow[]> {
  "use cache";
  cacheLife("days");

  const rows = await db
    .select({
      status: shopOrderTable.orderStatus,
      revenue: sql<string>`COALESCE(SUM(${shopOrderTable.orderTotal}), 0)::text`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(shopOrderTable)
    .where(isNull(shopOrderTable.deletedAt))
    .groupBy(shopOrderTable.orderStatus);

  const byStatus = new Map(rows.map((r) => [r.status, r]));
  return orderStatusEnum.map((status) => {
    const r = byStatus.get(status);
    return {
      status,
      revenue: r ? String(r.revenue) : "0",
      count: r ? Number(r.count) : 0,
    };
  });
}

export async function getOrdersByStatus(): Promise<OrdersByStatusRow[]> {
  await assertIsAdmin();
  return getOrdersByStatusCached();
}

// ─── 4. Inventory movement by reason (heavy — days) ──────────────────────────

async function getInventoryByReasonCached(): Promise<InventoryByReasonRow[]> {
  "use cache";
  cacheLife("days");

  const rows = await db
    .select({
      reason: inventoryLogTable.reason,
      magnitude: sql<number>`SUM(ABS(${inventoryLogTable.change}))::int`,
      stockIn: sql<number>`SUM(CASE WHEN ${inventoryLogTable.change} > 0 THEN ${inventoryLogTable.change} ELSE 0 END)::int`,
      stockOut: sql<number>`SUM(CASE WHEN ${inventoryLogTable.change} < 0 THEN ABS(${inventoryLogTable.change}) ELSE 0 END)::int`,
    })
    .from(inventoryLogTable)
    .groupBy(inventoryLogTable.reason)
    .orderBy(desc(sql`SUM(ABS(${inventoryLogTable.change}))`));

  const total = rows.reduce((s, r) => s + Number(r.magnitude), 0);
  return rows.map((r) => ({
    reason: r.reason,
    magnitude: Number(r.magnitude),
    pct: total > 0 ? (Number(r.magnitude) / total) * 100 : 0,
    stockIn: Number(r.stockIn),
    stockOut: Number(r.stockOut),
  }));
}

export async function getInventoryByReason(): Promise<InventoryByReasonRow[]> {
  await assertIsAdmin();
  return getInventoryByReasonCached();
}

// ─── 5. Revenue trend — frozen seeded window (heavy, days) ───────────────────

async function getRevenueTrendCached(): Promise<RevenueTrendPoint[]> {
  "use cache";
  cacheLife("days");

  const rows = await db
    .select({
      date: sql<string>`(${shopOrderTable.orderDate} AT TIME ZONE 'UTC')::date::text`,
      revenue: sql<string>`SUM(CASE WHEN ${shopOrderTable.orderStatus} != 'cancelled' THEN ${shopOrderTable.orderTotal} ELSE 0 END)::text`,
      orders: sql<number>`SUM(CASE WHEN ${shopOrderTable.orderStatus} != 'cancelled' THEN 1 ELSE 0 END)::int`,
    })
    .from(shopOrderTable)
    .where(isNull(shopOrderTable.deletedAt))
    .groupBy(sql`(${shopOrderTable.orderDate} AT TIME ZONE 'UTC')::date`)
    .orderBy(sql`(${shopOrderTable.orderDate} AT TIME ZONE 'UTC')::date`);

  return rows.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}

export async function getRevenueTrend(): Promise<RevenueTrendPoint[]> {
  await assertIsAdmin();
  return getRevenueTrendCached();
}

// ─── 6. Category tree product-count stats (heavy — days) ─────────────────────

async function getCategoryTreeStatsCached(): Promise<CategoryTreeStats> {
  "use cache";
  cacheLife("days");

  const cats = await db
    .select({
      id: productCategoryTable.id,
      parentCategoryId: productCategoryTable.parentCategoryId,
      name: productCategoryTable.categoryName,
    })
    .from(productCategoryTable);

  const counts = await db
    .select({
      categoryId: productTable.categoryId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(productTable)
    .where(isNull(productTable.deletedAt))
    .groupBy(productTable.categoryId);

  const directByCat = new Map(
    counts.map((c) => [c.categoryId, Number(c.count)]),
  );
  const childrenOf = new Map<number | null, typeof cats>();
  for (const c of cats) {
    const key = c.parentCategoryId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(c);
  }

  const subtreeTotals = new Map<number, number>();
  function subtree(id: number): number {
    const hit = subtreeTotals.get(id);
    if (hit !== undefined) return hit;
    let total = directByCat.get(id) ?? 0;
    for (const child of childrenOf.get(id) ?? []) total += subtree(child.id);
    subtreeTotals.set(id, total);
    return total;
  }
  for (const c of cats) subtree(c.id);

  const rootCats = childrenOf.get(null) ?? [];
  const grandTotal = rootCats.reduce((s, r) => s + subtree(r.id), 0);

  const roots: CategoryNodeStat[] = rootCats.map((r) => {
    const n = subtree(r.id);
    return {
      id: r.id,
      name: r.name,
      productCount: n,
      pct: grandTotal > 0 ? (n / grandTotal) * 100 : 0,
    };
  });

  const childrenByRoot: Record<number, CategoryNodeStat[]> = {};
  for (const r of rootCats) {
    const rootTotal = subtree(r.id);
    const out: CategoryNodeStat[] = [];
    const walk = (id: number) => {
      for (const child of childrenOf.get(id) ?? []) {
        const n = subtree(child.id);
        out.push({
          id: child.id,
          name: child.name,
          productCount: n,
          pct: rootTotal > 0 ? (n / rootTotal) * 100 : 0,
        });
        walk(child.id);
      }
    };
    walk(r.id);
    childrenByRoot[r.id] = out;
  }

  return { roots, childrenByRoot };
}

export async function getCategoryTreeStats(): Promise<CategoryTreeStats> {
  await assertIsAdmin();
  return getCategoryTreeStatsCached();
}

