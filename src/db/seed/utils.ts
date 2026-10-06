import { db } from "@/db/db";
import {
  productConfiguration,
  variationOption,
  variation,
  productItem,
  product,
  productCategory,
  shoppingCartItem,
  shoppingCart,
  orderLine,
  inventoryLog,
  shopOrder,
  accounts,
  sessions,
  users,
} from "@/db/schema";

/**
 * Deterministic PRNG (mulberry32) so `--reset` produces byte-identical data.
 * Returns a function yielding uniform [0,1); call `.refresh(seed)` for a new stream.
 */
export function mulberry32(seed: number): () => number {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) & 0xffffffff;
    let t = state;
    t = (t ^ (t >> 15)) * (t | 1);
    t = t ^ (t + ((t ^ (t >> 7)) * (t | 61)));
    return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296;
  };
}

/** Uniform integer in [min, max] (inclusive) from a PRNG. */
export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** `n` days ago (UTC), with a random time-of-day offset between 0-23h. */
export function daysAgoUtc(n: number, rng?: () => number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(rng ? Math.floor(rng() * 24) : 0, rng ? Math.floor(rng() * 60) : 0, 0, 0);
  return d;
}

/**
 * Delete all data in reverse FK dependency order,
 * so we never hit foreign-key violations.
 */
export async function clearTables() {
  await db.delete(productConfiguration);
  await db.delete(variationOption);
  await db.delete(variation);
  await db.delete(shoppingCartItem);
  await db.delete(shoppingCart);
  await db.delete(orderLine);
  await db.delete(inventoryLog);
  await db.delete(shopOrder);
  await db.delete(productItem);
  await db.delete(product);
  await db.delete(productCategory);
  await db.delete(accounts);
  await db.delete(sessions);
  await db.delete(users);

  console.log("✅ All tables cleared");
}