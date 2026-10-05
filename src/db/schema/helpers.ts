import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

/**
 * Shared timestamps for soft-deletable tables (`createdAt`/`updatedAt`
 * auto-updated, nullable `deletedAt`). Stored as `timestamptz`: Postgres keeps
 * one absolute UTC instant; viewers format it to their own local tz on the client.
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    // DB clock (not app clock) so updatedAt matches createdAt's `now()`.
    .$onUpdate(() => sql`now()`),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
};

/**
 * Simplified timestamps for immutable / append-only tables (no updatedAt, no deletedAt).
 */
export const createdAtOnly = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
};