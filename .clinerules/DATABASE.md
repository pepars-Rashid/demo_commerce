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
- **Column types** — `varchar` with explicit length, never `text`

## Varchar length reference
| Column | Length | Reason |
|---|---|---|
| `users.id`, `user_id` FKs | 36 | UUID |
| `users.name`, `email`, `password` | 255 | Standard |
| `users.image` | 2048 | URL |
| `accounts.provider` | 64 | "google", "github" |
| `accounts.provider_account_id` | 255 | OAuth IDs |
| `accounts.refresh_token`, `access_token` | 1024 | Tokens |
| `product.name` | 255 | Product name |
| `product.description` | 2000 | Description |
| `product.productImage` | 2048 | Single hero URL |
| `product_item.sku` | 64 | SKU codes |
| `variation.name` | 64 | "Size", "Color" |
| `variation_option.value` | 128 | "Red", "Extra Large" |
| `shop_order.shipping_address`, `billing_address` | 1000 | Full address block |
| `order_status` | 20 | Enum values are short |
| `inventory_log.reason` | 255 | Reason string |

## Directory structure
```
src/db/
├── schema/
│   ├── helpers.ts    # Shared timestamp helpers
│   ├── auth.ts       # users, accounts, sessions, etc.
│   ├── product.ts    # product_category, product, product_item, variations
│   ├── cart.ts       # shopping_cart, shopping_cart_item
│   ├── order.ts      # shop_order, order_line, inventory_log
│   └── index.ts      # Barrel re-exports
├── db.ts             # Drizzle client instantiation