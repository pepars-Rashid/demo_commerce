import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { productItem } from "./product";
import { timestamps, createdAtOnly } from "./helpers";

// ── Order Status Enum Values ──────────────────────────────────────────────
export const orderStatusEnum = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatusEnum)[number];

// ── Shop Order ────────────────────────────────────────────────────────────
export const shopOrder = pgTable(
  "shop_order",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    orderDate: timestamp("order_date", { mode: "date" })
      .notNull()
      .defaultNow(),
    orderTotal: decimal("order_total", { precision: 12, scale: 2 }).notNull(),
    orderStatus: varchar("order_status", { length: 20, enum: orderStatusEnum })
      .notNull()
      .default("pending"),
    shippingAddress: varchar("shipping_address", { length: 1000 }).notNull(),
    billingAddress: varchar("billing_address", { length: 1000 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("shop_order_user_id_idx").on(table.userId),
    index("shop_order_status_idx").on(table.orderStatus),
  ]
);

// ── Order Line ────────────────────────────────────────────────────────────
// Immutable — once written, never updated or soft-deleted (audit trail).
export const orderLine = pgTable(
  "order_line",
  {
    id: serial("id").primaryKey(),
    productItemId: integer("product_item_id")
      .notNull()
      .references(() => productItem.id, { onDelete: "restrict" }),
    orderId: integer("order_id")
      .notNull()
      .references(() => shopOrder.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    ...createdAtOnly,
  },
  (table) => [
    index("order_line_order_id_idx").on(table.orderId),
    index("order_line_product_item_idx").on(table.productItemId),
  ]
);

// ── Inventory Log ─────────────────────────────────────────────────────────
// Append-only audit trail for every stock change. Each row records WHO made the
// change (`userId`), WHERE it came from (`orderLineId`, null = admin/system
// action outside a customer order), WHAT changed (`change`), and WHY (`reason`).
//
// Indexed on product, line, user, and date so the ledger can be filtered for
// reporting (M4) without full scans. `userId`/`orderLineId` are set-null on
// delete so the audit history is never lost — in normal operation both are
// always populated by the application.
export const inventoryLog = pgTable(
  "inventory_log",
  {
    id: serial("id").primaryKey(),
    productItemId: integer("product_item_id")
      .notNull()
      .references(() => productItem.id, { onDelete: "cascade" }),
    // Origin order line (per-SKU inside shop_order). Null ⇒ admin/system action,
    // e.g. an admin stock adjustment that is not tied to a customer order.
    orderLineId: integer("order_line_id").references(() => orderLine.id, {
      onDelete: "set null",
    }),
    // Who performed this change (customer OR admin). Null only if the user's row
    // was hard-deleted.
    userId: varchar("user_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    change: integer("change").notNull(), // positive = stock in, negative = stock out
    reason: varchar("reason", { length: 255 }).notNull(), // e.g. "order_placed", "admin_adjustment", "return"
    ...createdAtOnly,
  },
  (table) => [
    index("inventory_log_product_item_idx").on(table.productItemId),
    index("inventory_log_order_line_idx").on(table.orderLineId),
    index("inventory_log_user_id_idx").on(table.userId),
    index("inventory_log_created_at_idx").on(table.createdAt),
  ]
);