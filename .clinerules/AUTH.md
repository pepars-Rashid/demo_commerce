# Authentication Rules

## Providers
- **Google** (OAuth) — `allowDangerousEmailAccountLinking: true` (links credential+OAuth accounts by email)
- **Credentials** (email/password) — custom `authorize` callback

## Config file
`src/lib/auth/auth.ts` — single source of truth. Exports `{ handlers, signIn, signOut, auth }`.

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
import { loginSchema } from "@/lib/zod/login"                  // login validation
import { signupSchema } from "@/lib/zod/signup"                // signup validation
```

## Directory structure
```
src/lib/auth/
├── auth.ts          # NextAuth config
└── password.ts      # bcryptjs hash/verify
src/lib/actions/
└── auth.ts          # signup Server Action
src/lib/zod/
├── login.ts         # Login form schema
└── signup.ts        # Signup form schema