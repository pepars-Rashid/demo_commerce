import {
  pgTable,
  serial,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { productItem } from "./product";
import { timestamps } from "./helpers";

// ── Shopping Cart ──────────────────────────────────────────────────────────
// One cart per logged-in user. No guest/anonymous carts.
export const shoppingCart = pgTable(
  "shopping_cart",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("shopping_cart_user_id_idx").on(table.userId),
  ]
);

// ── Shopping Cart Item ─────────────────────────────────────────────────────
export const shoppingCartItem = pgTable(
  "shopping_cart_item",
  {
    id: serial("id").primaryKey(),
    cartId: integer("cart_id")
      .notNull()
      .references(() => shoppingCart.id, { onDelete: "cascade" }),
    productItemId: integer("product_item_id")
      .notNull()
      .references(() => productItem.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("cart_item_cart_id_idx").on(table.cartId),
    index("cart_item_product_item_idx").on(table.productItemId),
  ]
);