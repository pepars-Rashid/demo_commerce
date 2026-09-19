"use server";

import { db } from "@/db/db";
import {
  shopOrder as shopOrderTable,
  orderLine as orderLineTable,
  productItem as productItemTable,
  product as productTable,
  users as usersTable,
  orderStatusEnum,
  type OrderStatus,
} from "@/db/schema";
import {
  and,
  or,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import type { Session } from "next-auth";
import { isAdmin, isSuperAdmin } from "@/lib/auth/permissions";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OrderListRow {
  id: number;
  orderStatus: OrderStatus;
  orderTotal: string;
  orderDate: Date;
  customerName: string | null;
  customerEmail: string | null;
  lineCount: number;
}

export interface OrderListResult {
  orders: OrderListRow[];
  totalPages: number;
  totalCount: number;
  page: number;
  pageSize: number;
  /** Whether the current session may mutate orders (superAdmin only). */
  canManage: boolean;
}

export interface OrderLineDetail {
  id: number;
  productItemId: number;
  productId: number | null;
  productName: string | null;
  productImage: string | null;
  sku: string | null;
  variantsJson: Record<string, string>;
  qty: number;
  price: string;
  lineTotal: string;
}

export interface OrderDetail {
  id: number;
  userId: string;
  customerName: string | null;
  customerEmail: string | null;
  orderDate: Date;
  orderStatus: OrderStatus;
  orderTotal: string;
  shippingAddress: string;
  billingAddress: string;
  createdAt: Date;
  lines: OrderLineDetail[];
  totalQty: number;
  canManage: boolean;
}

// ─── Auth helpers ───────────────────────────────────────────────────────────

/** Read access — any admin role (view/read orders). */
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

// ─── GET: Paginated order list (with user join) ────────────────────────────

export async function getOrders(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<OrderListResult> {
  const session = await assertIsAdmin();
  const canManage = isSuperAdmin(session.user?.role);

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [isNull(shopOrderTable.deletedAt)];
  if (params.status && orderStatusEnum.includes(params.status as OrderStatus)) {
    conditions.push(eq(shopOrderTable.orderStatus, params.status as OrderStatus));
  }
  if (params.search) {
    const raw = params.search.trim();
    const numericId = /^\d+$/.test(raw) ? Number(raw) : null;
    const like = `%${raw}%`;
    const searchCondition = or(
      numericId !== null ? eq(shopOrderTable.id, numericId) : undefined,
      ilike(usersTable.name, like),
      ilike(usersTable.email, like),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  // Two code paths so the COUNT query only joins users when searching on
  // name/email — otherwise it runs against shop_order alone (cheaper).
  const [countResult] = params.search
    ? await db
        .select({ value: count() })
        .from(shopOrderTable)
        .leftJoin(usersTable, eq(shopOrderTable.userId, usersTable.id))
        .where(and(...conditions))
    : await db
        .select({ value: count() })
        .from(shopOrderTable)
        .where(and(...conditions));

  const totalCount = Number(countResult.value);
  const totalPages = Math.ceil(totalCount / pageSize);

  const rows = await db
    .select({
      id: shopOrderTable.id,
      orderStatus: shopOrderTable.orderStatus,
      orderTotal: shopOrderTable.orderTotal,
      orderDate: shopOrderTable.orderDate,
      customerName: usersTable.name,
      customerEmail: usersTable.email,
      lineCount: sql<number>`COALESCE((SELECT count(*)::int FROM ${orderLineTable} WHERE ${orderLineTable.orderId} = ${shopOrderTable.id}), 0)`,
    })
    .from(shopOrderTable)
    .leftJoin(usersTable, eq(shopOrderTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(shopOrderTable.orderDate), desc(shopOrderTable.id))
    .limit(pageSize)
    .offset(offset);

  return { orders: rows, totalPages, totalCount, page, pageSize, canManage };
}
// ─── GET: Order detail (with customer + lines + brief product info) ─────────

export async function getOrderById(id: number): Promise<OrderDetail | null> {
  const session = await assertIsAdmin();
  const canManage = isSuperAdmin(session.user?.role);

  const [order] = await db
    .select({
      id: shopOrderTable.id,
      userId: shopOrderTable.userId,
      orderDate: shopOrderTable.orderDate,
      orderStatus: shopOrderTable.orderStatus,
      orderTotal: shopOrderTable.orderTotal,
      shippingAddress: shopOrderTable.shippingAddress,
      billingAddress: shopOrderTable.billingAddress,
      createdAt: shopOrderTable.createdAt,
      customerName: usersTable.name,
      customerEmail: usersTable.email,
    })
    .from(shopOrderTable)
    .leftJoin(usersTable, eq(shopOrderTable.userId, usersTable.id))
    .where(and(eq(shopOrderTable.id, id), isNull(shopOrderTable.deletedAt)))
    .limit(1);

  if (!order) return null;

  const lineRows = await db
    .select({
      id: orderLineTable.id,
      productItemId: orderLineTable.productItemId,
      productId: productItemTable.productId,
      productName: productTable.name,
      productImage: productTable.productImage,
      sku: productItemTable.sku,
      variantsJson: productItemTable.variantsJson,
      qty: orderLineTable.qty,
      price: orderLineTable.price,
      lineTotal: sql<string>`(${orderLineTable.price} * ${orderLineTable.qty})::text`,
    })
    .from(orderLineTable)
    .leftJoin(productItemTable, eq(orderLineTable.productItemId, productItemTable.id))
    .leftJoin(productTable, eq(productItemTable.productId, productTable.id))
    .where(eq(orderLineTable.orderId, id))
    .orderBy(asc(orderLineTable.id));

  const lines: OrderLineDetail[] = lineRows.map((l) => ({
    id: l.id,
    productItemId: l.productItemId,
    productId: l.productId,
    productName: l.productName,
    productImage: l.productImage,
    sku: l.sku,
    variantsJson: (l.variantsJson as Record<string, string> | undefined) ?? {},
    qty: l.qty,
    price: String(l.price),
    lineTotal: String(l.lineTotal),
  }));

  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);

  return {
    ...order,
    orderTotal: String(order.orderTotal),
    lines,
    totalQty,
    canManage,
  };
}

// ─── UPDATE: Status change / cancellation (superAdmin only) ─────────────────

export async function updateOrderStatus(id: number, status: OrderStatus) {
  await assertAdmin();

  if (!orderStatusEnum.includes(status)) {
    throw new Error("حالة غير صالحة");
  }

  await db
    .update(shopOrderTable)
    .set({ orderStatus: status })
    .where(and(eq(shopOrderTable.id, id), isNull(shopOrderTable.deletedAt)));

  revalidatePath("/profile/admin/orders");
  revalidatePath(`/profile/admin/orders/${id}`);

  return { success: true as const };
}