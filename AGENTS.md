<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Status
- Drizzle ORM + Neon, NextAuth.js v5 (JWT), Shadcn UI (--rtl), Tailwind v4 — **all configured**
- Auth (login/signup/logout, Google + credentials) — **complete**
- Admin panel: **products fully built** (list CRUD + modal interception), **orders/categories/inventory/users are placeholders**
- `<html lang="ar" dir="rtl">` — Arabic-first, all UI text in Arabic

## 📍 Technical Map — WHERE EVERYTHING LIVES
Read this before starting any task. Target only the files below — no blind directory scans.

| Concern | Location | Notes |
|---|---|---|
| **Routes (App Router)** | `src/app/**` | Admin routes under `src/app/profile/admin/` |
| **Admin layout guard** | `src/app/profile/admin/layout.tsx` | `requireAdmin()` + sidebar + Toaster — do not re-check auth in pages |
| **Server actions (DB CRUD)** | `src/lib/actions/` | `product.ts` = getProducts/getProductById/createProduct/updateProduct/deleteProduct/batchDeleteProducts/getProductCategories |
| **Form validation schemas** | `src/lib/zod/` | `login.ts`, `signup.ts`, `product.ts` |
| **DB schema (Drizzle)** | `src/db/schema/` | `auth.ts`, `product.ts`, `cart.ts`, `order.ts`, `relations.ts`, `index.ts` (barrel) |
| **DB client** | `src/db/db.ts` | Drizzle instantiation |
| **Seed data** | `src/db/seed/` | Users, products, variations + JSON data files |
| **Auth config** | `src/lib/auth/` | `auth.ts` (NextAuth), `password.ts` (bcrypt), `require-admin.ts` (DB role check), `auth-types.d.ts` |
| **Mock data (legacy/bridge)** | `src/lib/mock/` | Types used by product forms as bridge; orders/categories/inventory/users mocks for placeholders |
| **Client components (admin)** | `src/components/admin/` | Shared (`page-header`, `delete-dialog`, `empty-state`, `icon-action-button`, badges) + `products/` (forms, list) |
| **Shadcn UI primitives** | `src/components/ui/` | Installed components — see `.clinerules/UI.md` |
| **Sidebar** | `src/components/app-sidebar.tsx` | Admin nav — do not modify (minor polish ok) |
| **Formatting helpers** | `src/lib/admin-format.ts` | Arabic currency/date/number formatters |
| **Auth pages** | `src/app/login/`, `src/app/signup/` | Server components calling client forms |

## 🔗 File Relationship Rules (Context Guardrails)
- **Page → Data**: `src/app/profile/admin/**/page.tsx` (Server Component) → imports server actions from `@/lib/actions/<domain>.ts` → passes `initialData` to client components in `src/components/admin/<domain>/`
- **Form → Schema → Action**: `src/components/admin/products/product-form.tsx` (Client) → uses `productSchema` from `@/lib/zod/product.ts` → submits via `createProduct`/`updateProduct` from `@/lib/actions/product.ts`
- **Types**: `@/lib/mock/types.ts` — field names mirror `src/db/schema/` exactly (bridging pattern). Real action types exported from `@/lib/actions/product.ts` (`ProductListResult`, `ProductDetail`)
- **DB schema**: always the source of truth for field names — see `.clinerules/DATABASE.md`
- **Auth**: JWT role cached in token; `auth()` for server checks; `requireAdmin()` for admin layout (DB-checks role each request — intentional); `assertAdmin()` in server actions (JWT-only)

## ⚠️ Context Saving Protocol (READ BEFORE EVERY TASK)
1. **New admin page (orders/categories/inventory/users)**: read `.clinerules/UI.md` → `.clinerules/DATABASE.md` → `src/db/schema/<domain>.ts` → `src/db/schema/relations.ts` → existing mock file (`src/lib/mock/<domain>.ts`) → the closest *built* page as reference (`src/app/profile/admin/products/` + `src/components/admin/products/`). **Do NOT read** `src/lib/auth/`, `src/db/db.ts`, or unrelated schema domains.
2. **Auth work**: read `.clinerules/AUTH.md` → `src/lib/auth/auth.ts` → `src/lib/actions/auth.ts` → `src/lib/zod/<form>.ts`. **Do NOT read** admin components or product code.
3. **Schema/DB change**: read `.clinerules/DATABASE.md` → `src/db/schema/<domain>.ts` → `helpers.ts` → `relations.ts`. **Do NOT read** UI files.
4. **Product bug/feature**: read `@/lib/actions/product.ts` → `@/lib/zod/product.ts` → `src/components/admin/products/` → relevant `src/app/profile/admin/products/` page. **Do NOT read** mock data unless the bug touches form types.

## File Structure Rules
- New UI components → `src/components/ui/` (Shadcn) or `src/components/admin/` (feature-specific)
- API routes → `src/app/api/` (only NextAuth handler exists — don't add more unless asked)
- Database queries → ONLY inside server actions in `src/lib/actions/` (never in components)
- Shared utilities → `src/lib/`

## When Working With Me
- Small, incremental changes preferred
- Ask if you're unsure about a design decision
- Don't over-engineer - this is MVP phase

## Coding Rules for MVP
1. **Keep it simple** - no premature abstractions
2. **Server Components by default** - only add 'use client' when needed
3. **TypeScript strict** - no `any` types unless absolutely necessary
4. **No new dependencies without asking** - we have what we need
5. **Drizzle schema changes** - always modify in the folder `src/db/schema`, don't push (I'll do it)
6. **Auth** - see `.clinerules/AUTH.md` for auth rules, structure, and conventions
7. **Components** - use Shadcn UI first, custom only when needed
8. **UI work** - see `.clinerules/UI.md` for admin panel UI rules, RTL conventions, and mock data schema
9. **DB work** - see `.clinerules/DATABASE.md` for schema conventions and varchar lengths
