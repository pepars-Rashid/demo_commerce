import { relations } from "drizzle-orm";
import {
  users,
  accounts,
  sessions,
} from "./auth";
import {
  productCategory,
  product,
  productItem,
  variation,
  variationOption,
  productConfiguration,
} from "./product";
import {
  shoppingCart,
  shoppingCartItem,
} from "./cart";
import {
  shopOrder,
  orderLine,
  inventoryLog,
} from "./order";

// ── Auth Relations ─────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  cart: many(shoppingCart),
  orders: many(shopOrder),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));


// ── Product Relations ──────────────────────────────────────────────────────
export const productCategoryRelations = relations(productCategory, ({ one, many }) => ({
  parent: one(productCategory, {
    fields: [productCategory.parentCategoryId],
    references: [productCategory.id],
  }),
  children: many(productCategory),
  products: many(product),
  variations: many(variation),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(productCategory, {
    fields: [product.categoryId],
    references: [productCategory.id],
  }),
  items: many(productItem),
}));

export const productItemRelations = relations(productItem, ({ one, many }) => ({
  product: one(product, {
    fields: [productItem.productId],
    references: [product.id],
  }),
  configurations: many(productConfiguration),
  cartItems: many(shoppingCartItem),
  orderLines: many(orderLine),
  inventoryLogs: many(inventoryLog),
}));

export const variationRelations = relations(variation, ({ one, many }) => ({
  category: one(productCategory, {
    fields: [variation.categoryId],
    references: [productCategory.id],
  }),
  options: many(variationOption),
}));

export const variationOptionRelations = relations(variationOption, ({ one, many }) => ({
  variation: one(variation, {
    fields: [variationOption.variationId],
    references: [variation.id],
  }),
  configurations: many(productConfiguration),
}));

export const productConfigurationRelations = relations(productConfiguration, ({ one }) => ({
  productItem: one(productItem, {
    fields: [productConfiguration.productItemId],
    references: [productItem.id],
  }),
  variationOption: one(variationOption, {
    fields: [productConfiguration.variationOptionId],
    references: [variationOption.id],
  }),
}));

// ── Cart Relations ─────────────────────────────────────────────────────────
export const shoppingCartRelations = relations(shoppingCart, ({ one, many }) => ({
  user: one(users, {
    fields: [shoppingCart.userId],
    references: [users.id],
  }),
  items: many(shoppingCartItem),
}));

export const shoppingCartItemRelations = relations(shoppingCartItem, ({ one }) => ({
  cart: one(shoppingCart, {
    fields: [shoppingCartItem.cartId],
    references: [shoppingCart.id],
  }),
  productItem: one(productItem, {
    fields: [shoppingCartItem.productItemId],
    references: [productItem.id],
  }),
}));

// ── Order Relations ────────────────────────────────────────────────────────
export const shopOrderRelations = relations(shopOrder, ({ one, many }) => ({
  user: one(users, {
    fields: [shopOrder.userId],
    references: [users.id],
  }),
  lines: many(orderLine),
}));

export const orderLineRelations = relations(orderLine, ({ one }) => ({
  order: one(shopOrder, {
    fields: [orderLine.orderId],
    references: [shopOrder.id],
  }),
  productItem: one(productItem, {
    fields: [orderLine.productItemId],
    references: [productItem.id],
  }),
}));

export const inventoryLogRelations = relations(inventoryLog, ({ one }) => ({
  productItem: one(productItem, {
    fields: [inventoryLog.productItemId],
    references: [productItem.id],
  }),
}));