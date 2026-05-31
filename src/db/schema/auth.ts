import {
  pgTable,
  varchar,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";

// ── Users ──────────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: varchar("image", { length: 2048 }),
    password: varchar("password", { length: 255 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
  ]
);

// ── Accounts ───────────────────────────────────────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refreshToken: varchar("refresh_token", { length: 1024 }),
    accessToken: varchar("access_token", { length: 1024 }),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 64 }),
    scope: varchar("scope", { length: 512 }),
    idToken: varchar("id_token", { length: 2048 }),
    sessionState: varchar("session_state", { length: 512 }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("accounts_user_id_idx").on(table.userId),
  ]
);

// ── Sessions ───────────────────────────────────────────────────────────────
export const sessions = pgTable(
  "sessions",
  {
    sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
  ]
);

// ── Verification Tokens ────────────────────────────────────────────────────
// Ephemeral table — no timestamps needed; tokens are write-once and hard-deleted.
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
  ]
);