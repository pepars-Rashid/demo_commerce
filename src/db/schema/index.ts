// ── Auth ──────────────────────────────────────────────────────────────────
export {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "./auth";

// ── Product ───────────────────────────────────────────────────────────────
export {
  productCategory,
  product,
  productItem,
  variation,
  variationOption,
  productConfiguration,
} from "./product";

// ── Cart ──────────────────────────────────────────────────────────────────
export {
  shoppingCart,
  shoppingCartItem,
} from "./cart";

// ── Order ─────────────────────────────────────────────────────────────────
export {
  orderStatusEnum,
  shopOrder,
  orderLine,
  inventoryLog,
} from "./order";
export type { OrderStatus } from "./order";

// ── Relations (for Drizzle queries) ───────────────────────────────────────
export {
  usersRelations,
  accountsRelations,
  sessionsRelations,
  productCategoryRelations,
  productRelations,
  productItemRelations,
  variationRelations,
  variationOptionRelations,
  productConfigurationRelations,
  shoppingCartRelations,
  shoppingCartItemRelations,
  shopOrderRelations,
  orderLineRelations,
  inventoryLogRelations,
} from "./relations";