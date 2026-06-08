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