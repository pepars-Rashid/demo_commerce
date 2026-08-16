# Authentication Rules

## Providers
- **Google** (OAuth) — `allowDangerousEmailAccountLinking: true` (links credential+OAuth accounts by email)
- **Credentials** (email/password) — custom `authorize` callback

## Config file
`src/lib/auth/auth.ts` — single source of truth. Exports `{ handlers, signIn, signOut, auth }`.

## Session strategy
- **JWT** — `session: { strategy: "jwt" }` forced because DrizzleAdapter defaults to database sessions
- Credentials users → JWT cookie (fast, no DB lookup)
- Google OAuth users → still creates DB session row via adapter (coexists fine)

## Role flow (callbacks)
- `jwt` callback: on first login, grabs `role` from `authorize` return or DB → stores in token
- `session` callback: copies `token.role` to `session.user.role` on every request
- Result: role checked once at login, then cached in JWT — zero DB queries on subsequent requests
- Changing role in DB → logout + login to refresh

## Role authorization — two guards, two behaviors
| Guard | Location | Behavior | When to use |
|---|---|---|---|
| `requireAdmin()` | `src/lib/auth/require-admin.ts` | `auth()` + DB query on `users.role` + `redirect()` | Admin **layout** guard — one call per page request |
| `assertAdmin()` | inline in each server action (`src/lib/actions/product.ts`) | `auth()` + checks `session.user.role` from JWT only (no DB query) | Inside **server actions** before mutations |

- `requireAdmin` returns the session; layout renders `null` if redirected
- `assertAdmin` throws `new Error("غير مصرح")` on failure
- **Rule**: UI pages must NOT call either — layout handles it

## Role system
- `users.role` column: `"user"` (default) | `"superAdmin"`
- Set via DB directly (seed script or direct update), no admin panel yet
- Access from session: `session.user.role` — available in both server & client components
- Check example: `src/app/profile/page.tsx` (`user.role === "superAdmin"`)
- Type augmentation in `src/lib/auth/auth-types.d.ts`

## Password hashing
`src/lib/auth/password.ts` — bcryptjs, 8 salt rounds:
- `hashPassword(password)` → hash
- `verifyPassword(password, hash)` → boolean

## Signup flow
1. Client form calls `signupAction` (Server Action in `src/lib/actions/auth.ts`)
2. Validates with Zod schema, checks duplicate email, hashes password, inserts user
3. On success → `signIn("credentials", { email, password, redirectTo: "/" })` auto-login
4. On failure → `setError("email", ...)` for duplicate, `setError("root", ...)` for general errors

## Login flow
- Form calls `signIn("credentials", { email, password, redirectTo: "/" })`
- `authorize` callback: `safeParseAsync` → lookup user by email → verify password → return user or `null`
- Invalid credentials → `setError("root", ...)` — generic message, not field-specific
- NOTE: login form uses `redirect: false` then manually pushes to `/` (does not use `redirectTo` option)

## Error positioning
| Error type | Position |
|---|---|
| Zod validation (client-side) | On the specific field |
| Duplicate email | On email field (`setError("email")`) |
| Wrong credentials | Below submit button (`setError("root")`) |
| Server/network errors | Below submit button (`setError("root")`) |

## Protected routes
- Server component: `auth()` → check `session?.user` → `redirect("/login")` if not authenticated
- Example: `src/app/profile/page.tsx`

## Auth-aware pages
- `/login`, `/signup` — check `auth()` on server, redirect to `/profile` if already logged in

## Logout
- Client component: `signOut({ redirectTo: "/login" })`
- Example: `src/components/logout-button.tsx`

## Key imports
```ts
import { auth, signIn, signOut } from "@/lib/auth/auth"      // server
import { signIn, signOut } from "next-auth/react"              // client
import { signupAction } from "@/lib/actions/auth"              // signup Server Action
import { requireAdmin } from "@/lib/auth/require-admin"        // admin layout guard
import { loginSchema } from "@/lib/zod/login"                  // login validation
import { signupSchema } from "@/lib/zod/signup"                // signup validation
```

## Directory structure
```
src/lib/auth/
├── auth.ts            # NextAuth config
├── auth-types.d.ts    # Type augmentation (User.role)
├── password.ts        # bcryptjs hash/verify
└── require-admin.ts   # Server-side admin guard (DB role check + redirect)
src/lib/actions/
└── auth.ts            # signup Server Action
src/lib/zod/
├── login.ts           # Login form schema
└── signup.ts          # Signup form schema
```
