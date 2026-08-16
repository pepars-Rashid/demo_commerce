# UI Guidelines for demo_commerce — Admin Panel (RTL / Arabic)

## CRITICAL: Next.js Version Awareness
This project uses **Next.js 16.2.6** with breaking changes. Before generating any code:
1. Read `AGENTS.md` at project root
2. Cross-reference any Next.js API against `node_modules/next/dist/docs/`

## Phase Status
- **Products** (list, new, edit, view, modal interception) — ✅ **REAL DB** — follow the data-flow pattern below
- **Orders, Categories, Inventory, Users** — ⏳ placeholder pages — use mock data arrays with **exact DB schema field names** until real server actions exist

## Data Flow Pattern (follow for ALL new admin pages)
```
Server Component (page.tsx)
  → calls server action from @/lib/actions/<domain>.ts
  → passes result as `initialData` prop
Client Component (src/components/admin/<domain>/*)
  → receives initialData + manages URL state (searchParams) via useRouter
  → useTransition for pending states
  → revalidatePath after mutations (inside the server action)
```
- Server actions return **typed result objects** (e.g. `ProductListResult`, `ProductDetail` in `@/lib/actions/product.ts`)
- Pages map DB results into form/mock shapes (see bridged types below)

## Bridged Types (IMPORTANT)
- `src/lib/mock/types.ts` — field names match DB schema exactly
- `product-form-page.tsx` / `product-form.tsx` / `product-form-sheet.tsx` currently consume `Product`, `ProductCategory`, `ProductItem` from `@/lib/mock/types`
- `[id]/page.tsx` maps server-action results (`ProductDetail`) INTO those mock shapes before passing to forms
- **New pages**: prefer server-action types; only use mock types when no server action exists yet

## Route Structure (admin)
```
/profile/                          → User profile (all logged-in users)
/profile/admin/                    → Dashboard (superAdmin only)
/profile/admin/layout.tsx          → requireAdmin() + SidebarProvider + AppSidebar + Toaster (already done)
/profile/admin/loading.tsx         → Skeleton loading (already done)
/profile/admin/error.tsx           → Error boundary (already done)
/profile/admin/products/           → Product list (REAL DB)
/profile/admin/products/new/       → Create product
/profile/admin/products/[id]/      → Edit product (?view=true = read-only)
/profile/admin/products/@modal/(.)new  → Sheet modal intercept
/profile/admin/products/@modal/(.)[id] → Sheet modal intercept
/profile/admin/orders/             → Order list (PLACEHOLDER)
/profile/admin/orders/[id]/        → Order detail (PLACEHOLDER)
/profile/admin/categories/         → Category list (PLACEHOLDER)
/profile/admin/categories/new/     → Create category (PLACEHOLDER)
/profile/admin/categories/[id]/    → Edit category (PLACEHOLDER)
/profile/admin/inventory/          → Stock levels & logs (PLACEHOLDER)
/profile/admin/users/              → User list (PLACEHOLDER)
```

## Auth Guard
Already handled in `/profile/admin/layout.tsx` — do NOT check auth in your pages.
- Pages must NOT call `requireAdmin()` or `auth()` (layout does it)
- Client components call server actions directly (e.g. `deleteProduct` from `@/lib/actions/product`) — those actions self-check auth

## Tech Stack
Next.js 16.2.6 (App Router), React 19.2.4, TypeScript strict, Tailwind CSS v4, Shadcn UI (radix-nova), Radix UI, NextAuth.js v5 (JWT), Drizzle ORM + PostgreSQL, React Hook Form, Zod v4, Lucide React.

## RTL / Arabic
- `<html lang="ar" dir="rtl">` already set
- Font: Noto Sans Arabic (`--font-sans`)
- Use `me-*`/`ms-*` instead of `mr-*`/`ml-*`
- Use `start`/`end` instead of `left`/`right`
- Use `end` for right-side elements (e.g. sheet side="end" for RTL)
- All text in Arabic — labels, buttons, headings, placeholders, toasts

## Import Aliases — READ THESE FIRST (Context Guardrails)
```ts
@/components/ui/...   → Shadcn UI components (src/components/ui/)
@/components/admin/...→ Admin feature components (src/components/admin/<domain>/)
@/lib/admin-format    → formatCurrency/formatNumber/formatDate/formatDateTime (Arabic)
@/lib/actions/<domain>→ Server actions (GET + mutations) — real DB
@/lib/zod/<domain>    → Form validation schemas
@/lib/utils           → cn() utility
```
- **Server actions exist for products only** (`@/lib/actions/product.ts`). For orders/categories/inventory/users, no server actions yet — use mock data from `@/lib/mock/`

## Available Shadcn Components
button, card, input, label, field, separator, table, dialog, dropdown-menu, select, sonner (toast), badge, avatar, sheet, skeleton, breadcrumb, collapsible, pagination, popover, textarea, tooltip, sidebar, direction.
Suggest installing any others: `npx shadcn@latest add [component]`

## Rules
### DOs ✅
- Shadcn UI for all elements
- `"use client"` only for interactivity (onClick, useState, useEffect, usePathname, useRouter)
- Arabic for all text
- RTL-aware CSS (`me-*`/`ms-*`, `start`/`end`)
- TypeScript interfaces for props (no `any`)
- Loading, empty, and error states on every page
- Sonner for toasts, dialog for delete confirmations
- Server Component → server action → `initialData` → Client Component pattern (products)
- Mock data must use **exact DB schema field names** (see DATABASE.md + schema table below)

### DON'Ts ❌
- No direct DB queries in components (`db.query`, `db.select` — those live in `src/lib/actions/`)
- No server actions in UI files (`"use server"` — those live in `src/lib/actions/`)
- No API routes (`src/app/api/`) — only NextAuth's own handler exists
- No NextAuth imports in pages (`auth()`, `signIn`, `signOut` — layout/actions handle it)
- No `requireAdmin` in pages — layout already handles it
- No modifying `src/db/schema/`, `src/lib/auth/`, `next.config.ts`, `package.json`
- No new npm packages without asking
- Do NOT modify `src/components/app-sidebar.tsx` (nav: Dashboard, Products, Orders, Categories, Inventory, Users) — minor polishing ok

## Schema Field Names for Mock/Form Data
Use these exact field names so real queries can be swapped in later without refactoring:
```
productCategory:        id, parentCategoryId, categoryName, slug, categoryImage
product:                id, categoryId, name, description, basePrice, totalStock, productImage
productItem:            id, productId, sku, qtyInStock, reservedStock, price, discountPrice, images, variantsJson
variation:              id, categoryId, name
variationOption:        id, variationId, value
productConfiguration:   id, productItemId, variationOptionId
shopOrder:              id, userId, orderDate, orderTotal, orderStatus, shippingAddress, billingAddress
orderLine:              id, productItemId, orderId, qty, price
inventoryLog:           id, productItemId, change, reason
shoppingCart:           id, userId
shoppingCartItem:       id, cartId, productItemId, qty
users:                  id, name, email, emailVerified, image, password, role
```
**Enum values** — role: `"user"`|`"superAdmin"` | orderStatus: `"pending"`|`"paid"`|`"shipped"`|`"delivered"`|`"cancelled"` | change: positive=in, negative=out

## Form Pattern (products)
- React Hook Form + Zod resolver (`@/lib/zod/product.ts` exports `productSchema`, `ProductFormValues`)
- Shadcn `Field` components for label/error/control
- Coerce numbers via `z.coerce.number()`
- `ProductForm` client component submits via server actions (`createProduct`/`updateProduct`)
- `rowVariantsToJson` helper in `@/lib/actions/product.ts` converts form variant rows → `variantsJson`
- Sonner toasts for success/error feedback
