# Database Rules

## Timestamps
- Use `...timestamps` from `helpers.ts` for mutable tables (soft-delete)
- Use `...createdAtOnly` for immutable tables (`order_line`, `inventory_log`)
- `verification_tokens` = no timestamps

## pgTable syntax (new Drizzle API)
- Third param = **array**, not object:
```ts
(t) => [ index("name").on(t.col) ]
```

## Conventions
- **File per domain:** `auth.ts`, `product.ts`, `cart.ts`, `order.ts`
- **Soft delete** (`deleted_at`) on all mutable e-commerce tables
- **Immutables:** `order_line`, `inventory_log` — no updates, no soft delete
- **Index every FK**
- **Addresses** = plain text columns on `shop_order`
- **No guest carts** — `shopping_cart.user_id` is unique + required
- **Currency** = single default (SAR), no column
- **Order status** = enum text column, not a lookup table
- **Images** — `product.productImage` = single `varchar(2048)` (hero), `product_item.images` = JSONB array (gallery)
- **Discounts** — `product_item.discount_price` (per-SKU), not on `product`
- **Variants** = normalized EAV + denormalized `variants_json` on `product_item`
- **Enum-like columns** — `varchar(length, enum: [...])` pattern, not `pgEnum` or a lookup table
- **Column types** — `varchar` with explicit length, never `text`
- **Aggregated denormalized fields** — `product.totalStock` (integer, default 0) is denormalized from `product_item.qty_in_stock` and maintained by server actions — do not compute on read

## Varchar length reference
| Column | Length | Reason |
|---|---|---|
| `users.id`, `user_id` FKs | 36 | UUID |
| `users.name`, `email`, `password` | 255 | Standard |
| `users.image` | 2048 | URL |
| `accounts.provider` | 64 | "google", "github" |
| `accounts.provider_account_id` | 255 | OAuth IDs |
| `accounts.refresh_token`, `access_token` | 1024 | Tokens |
| `accounts.id_token` | 2048 | OIDC token |
| `product.name` | 255 | Product name |
| `product.description` | 2000 | Description |
| `product.productImage` | 2048 | Single hero URL |
| `product_item.sku` | 64 | SKU codes |
| `variation.name` | 64 | "Size", "Color" |
| `variation_option.value` | 128 | "Red", "Extra Large" |
| `shop_order.shipping_address`, `billing_address` | 1000 | Full address block |
| `order_status` | 20 | Enum values are short |
| `role` | 20 | "user" / "superAdmin" |
| `inventory_log.reason` | 255 | Reason string |

## Key non-varchar columns
| Column | Type | Notes |
|---|---|---|
| `product.basePrice`, `product_item.price`, `product_item.discountPrice`, `shop_order.orderTotal`, `order_line.price` | `decimal(12,2)` | Monetary — strings from DB, coerce with `Number()` |
| `product.totalStock`, `product_item.qtyInStock`, `product_item.reservedStock`, `inventory_log.change` | `integer` | Stock amounts |
| `product_item.images`, `product_item.variantsJson` | `jsonb` | Gallery array + denormalized `Record<string,string>` |
| `product.id`, `productCategory.id`, etc. | `serial` | Auto-increment IDs |
| `users.id` | `varchar(36)` | UUID via `crypto.randomUUID()` |

## Directory structure
```
src/db/
├── schema/
│   ├── helpers.ts      # Shared timestamp helpers
│   ├── auth.ts         # users, accounts, sessions, verification_tokens
│   ├── product.ts      # product_category, product, product_item, variation, variation_option, product_configuration
│   ├── cart.ts         # shopping_cart, shopping_cart_item
│   ├── order.ts        # shop_order, order_line, inventory_log
│   ├── relations.ts    # Drizzle relations definitions
│   └── index.ts        # Barrel re-exports
├── db.ts               # Drizzle client instantiation
└── seed/
    ├── index.ts        # Seed runner
    ├── products.ts     # Product seeding
    ├── users.ts        # User seeding
    ├── variations.ts   # Variation seeding
    ├── utils.ts        # Seed helpers
    └── data/           # JSON files (categories, products-*, variations-config)
```

## Context Guardrail
- To understand a feature's data model, read ONLY: `src/db/schema/<domain>.ts` + `src/db/schema/relations.ts` + `helpers.ts`
- Do NOT read `src/db/db.ts` (client instantiation only) unless debugging connection issues
- Mock types in `src/lib/mock/types.ts` mirror these field names exactly — read it for UI-facing shapes instead of re-reading schema
- Server action types (e.g. `ProductListResult` in `@/lib/actions/product.ts`) are the real data contracts for pages
