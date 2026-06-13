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
import type { AdapterAccountType } from "@auth/core/adapters";
import { timestamps } from "./helpers";

// ── Role Values ────────────────────────────────────────────────────────────
export const roleValues = ["user", "superAdmin"] as const;
export type Role = (typeof roleValues)[number];

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
    role: varchar("role", { length: 20, enum: roleValues })
      .notNull()
      .default("user"),
    ...timestamps,
  },
  (table) => []
);

// ── Accounts ───────────────────────────────────────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).$type<AdapterAccountType>().notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: varchar("refresh_token", { length: 1024 }),
    access_token: varchar("access_token", { length: 1024 }),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 64 }),
    scope: varchar("scope", { length: 512 }),
    id_token: varchar("id_token", { length: 2048 }),
    session_state: varchar("session_state", { length: 512 }),
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