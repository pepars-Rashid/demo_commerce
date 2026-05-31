import { timestamp } from "drizzle-orm/pg-core";

/**
 * Shared timestamp columns for soft-deletable tables.
 * `createdAt` / `updatedAt` with auto-update, and nullable `deletedAt`.
 */
export const timestamps = {
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
};

/**
 * Simplified timestamps for immutable / append-only tables (no updatedAt, no deletedAt).
 */
export const createdAtOnly = {
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
};