import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";

// ── Product Category ───────────────────────────────────────────────────────
export const productCategory = pgTable(
  "product_category",
  {
    id: serial("id").primaryKey(),
    parentCategoryId: integer("parent_category_id").references(
      (): any => productCategory.id,
      { onDelete: "set null" }
    ),
    categoryName: varchar("category_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    categoryImage: varchar("category_image", { length: 2048 }),
    ...timestamps,
  },
  (table) => [
    index("product_category_parent_idx").on(table.parentCategoryId),
    index("product_category_slug_idx").on(table.slug),
  ]
);

// ── Product ────────────────────────────────────────────────────────────────
// Base product with shared info. Hero image is a single URL for fast catalog rendering.
export const product = pgTable(
  "product",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => productCategory.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2000 }),
    basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
    productImage: varchar("product_image", { length: 2048 }), // single hero URL
    ...timestamps,
  },
  (table) => [
    index("product_category_id_idx").on(table.categoryId),
  ]
);

// ── Product Item (SKU) ─────────────────────────────────────────────────────
// Each variant SKU has its own price, discount, stock, and gallery images.
export const productItem = pgTable(
  "product_item",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 64 }).notNull().unique(),
    qtyInStock: integer("qty_in_stock").notNull().default(0),
    reservedStock: integer("reserved_stock").notNull().default(0),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    discountPrice: decimal("discount_price", { precision: 12, scale: 2 }),
    images: jsonb("images").$type<string[]>().default([]), // gallery URLs per variant
    // Denormalized variant data for fast rendering (e.g. { "Color": "Red", "Size": "M" })
    variantsJson: jsonb("variants_json").default({}),
    ...timestamps,
  },
  (table) => [
    index("product_item_product_id_idx").on(table.productId),
    index("product_item_sku_idx").on(table.sku),
  ]
);

// ── Variation ──────────────────────────────────────────────────────────────
export const variation = pgTable(
  "variation",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => productCategory.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("variation_category_id_idx").on(table.categoryId),
  ]
);

// ── Variation Option ───────────────────────────────────────────────────────
export const variationOption = pgTable(
  "variation_option",
  {
    id: serial("id").primaryKey(),
    variationId: integer("variation_id")
      .notNull()
      .references(() => variation.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 128 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("variation_option_variation_id_idx").on(table.variationId),
  ]
);

// ── Product Configuration (Junction: product_item ↔ variation_option) ──────
export const productConfiguration = pgTable(
  "product_configuration",
  {
    id: serial("id").primaryKey(),
    productItemId: integer("product_item_id")
      .notNull()
      .references(() => productItem.id, { onDelete: "cascade" }),
    variationOptionId: integer("variation_option_id")
      .notNull()
      .references(() => variationOption.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("product_config_product_item_idx").on(table.productItemId),
    index("product_config_var_option_idx").on(table.variationOptionId),
  ]
);