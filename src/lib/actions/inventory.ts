"use server";

import { db } from "@/db/db";
import {
  inventoryLog as inventoryLogTable,
  productItem as productItemTable,
  product as productTable,
  orderLine as orderLineTable,
  shopOrder as shopOrderTable,
} from "@/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import type { Session } from "next-auth";
import { isAdmin, isSuperAdmin } from "@/lib/auth/permissions";
import { inventoryLogSchema } from "@/lib/zod/inventory";
import type { InventoryLogFormValues } from "@/lib/zod/inventory";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface InventoryLogRow {
  id: number;
  productItemId: number;
  productId: number | null;
  productName: string | null;
  productImage: string | null;
  sku: string | null;
  variantsJson: Record<string, string>;
  /** Null ⇒ manual / admin entry not tied to a customer order. */
  orderLineId: number | null;
  orderId: number | null;
  /** Null ⇒ the actor's user row was hard-deleted. */
  userId: string | null;
  change: number; // positive = in, negative = out
  reason: string;
  createdAt: Date;
}

export interface InventoryLedgerResult {
  logs: InventoryLogRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  /** Whether another page exists to append via "تحميل المزيد". */
  hasMore: boolean;
  /** Whether the current session may create manual entries (superAdmin). */
  canManage: boolean;
}

// ─── Auth helpers (mirror order.ts) ─────────────────────────────────────────

/** Read access — any admin role. */
async function assertIsAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    throw new Error("غير مصرح");
  }
  return session;
}

/** Mutation access — superAdmin only. */
async function assertAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user.role)) {
    throw new Error("غير مصرح");
  }
  return session;
}

// ─── GET: Inventory ledger (append pagination) ──────────────────────────────

export async function getInventoryLogs(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  from?: string; // YYYY-MM-DD, inclusive
  to?: string; // YYYY-MM-DD, inclusive (whole day)
  source?: string; // "all" | "orders" | "manual"
}): Promise<InventoryLedgerResult> {
  const session = await assertIsAdmin();
  const canManage = isSuperAdmin(session.user?.role);

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];

  // Source filter — "orders" = has an origin order line; "manual" = admin entry.
  if (params.source === "orders") {
    conditions.push(isNotNull(inventoryLogTable.orderLineId));
  } else if (params.source === "manual") {
    conditions.push(isNull(inventoryLogTable.orderLineId));
  }

  // Date interval (inclusive). `to` is treated as end-of-day.
  if (params.from) {
    const fromDate = new Date(`${params.from}T00:00:00Z`);
    if (!Number.isNaN(fromDate.getTime())) {
      conditions.push(gte(inventoryLogTable.createdAt, fromDate));
    }
  }
  if (params.to) {
    const toDate = new Date(`${params.to}T00:00:00Z`);
    if (!Number.isNaN(toDate.getTime())) {
      conditions.push(
        lt(inventoryLogTable.createdAt, new Date(toDate.getTime() + 24 * 60 * 60 * 1000)),
      );
    }
  }

  if (params.search) {
    const raw = params.search.trim();
    const like = `%${raw}%`;
    const numericId = /^\d+$/.test(raw) ? Number(raw) : null;
    const condition = or(
      numericId !== null ? eq(inventoryLogTable.id, numericId) : undefined,
      numericId !== null ? eq(shopOrderTable.id, numericId) : undefined,
      ilike(productTable.name, like),
      ilike(productItemTable.sku, like),
      ilike(inventoryLogTable.reason, like),
      eq(inventoryLogTable.userId, raw),
    );
    if (condition) conditions.push(condition);
  }

  const where = conditions.length ? and(...conditions) : undefined;

  // COUNT
  const [countResult] = await db
    .select({ value: count() })
    .from(inventoryLogTable)
    .leftJoin(productItemTable, eq(inventoryLogTable.productItemId, productItemTable.id))
    .leftJoin(productTable, eq(productItemTable.productId, productTable.id))
    .leftJoin(orderLineTable, eq(inventoryLogTable.orderLineId, orderLineTable.id))
    .leftJoin(shopOrderTable, eq(orderLineTable.orderId, shopOrderTable.id))
    .where(where);
  const totalCount = Number(countResult.value);
  const totalPages = Math.ceil(totalCount / pageSize);

  // Rows
  const rows = await db
    .select({
      id: inventoryLogTable.id,
      productItemId: inventoryLogTable.productItemId,
      productId: productTable.id,
      productName: productTable.name,
      productImage: productTable.productImage,
      sku: productItemTable.sku,
      variantsJson: productItemTable.variantsJson,
      orderLineId: inventoryLogTable.orderLineId,
      orderId: shopOrderTable.id,
      userId: inventoryLogTable.userId,
      change: inventoryLogTable.change,
      reason: inventoryLogTable.reason,
      createdAt: inventoryLogTable.createdAt,
    })
    .from(inventoryLogTable)
    .leftJoin(productItemTable, eq(inventoryLogTable.productItemId, productItemTable.id))
    .leftJoin(productTable, eq(productItemTable.productId, productTable.id))
    .leftJoin(orderLineTable, eq(inventoryLogTable.orderLineId, orderLineTable.id))
    .leftJoin(shopOrderTable, eq(orderLineTable.orderId, shopOrderTable.id))
    .where(where)
    .orderBy(desc(inventoryLogTable.createdAt), desc(inventoryLogTable.id))
    .limit(pageSize)
    .offset(offset);

  const logs: InventoryLogRow[] = rows.map((r) => ({
    ...r,
    variantsJson: (r.variantsJson as Record<string, string> | undefined) ?? {},
  }));

  return {
    logs,
    totalCount,
    totalPages,
    page,
    pageSize,
    hasMore: offset + rows.length < totalCount,
    canManage,
  };
}
// ─── CREATE: Manual log entry (superAdmin only) ────────────────────────────

export async function createInventoryLog(input: InventoryLogFormValues) {
  const session = await assertAdmin();

  const parsed = inventoryLogSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("بيانات غير صالحة");
  }
  const { sku, direction, amount, reason } = parsed.data;
  const change = direction === "in" ? amount : -amount;

  // Resolve the entered SKU to a product_item before writing an audit row.
  const [item] = await db
    .select({ id: productItemTable.id })
    .from(productItemTable)
    .leftJoin(productTable, eq(productItemTable.productId, productTable.id))
    .where(
      and(eq(productItemTable.sku, sku), isNull(productTable.deletedAt)),
    )
    .limit(1);
  if (!item) {
    throw new Error("لم يتم العثور على SKU بهذا الرمز");
  }

  await db.insert(inventoryLogTable).values({
    productItemId: item.id,
    orderLineId: null,
    userId: session.user!.id,
    change,
    reason: reason.trim(),
  });

  revalidatePath("/profile/admin/inventory");
  return { success: true as const };
}