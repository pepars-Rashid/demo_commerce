import type { InventoryLog } from "./types";

export const LOW_STOCK_THRESHOLD = 5;

export const inventoryLogs: InventoryLog[] = [
  {
    id: "log_1",
    productItemId: "item_iphone15_256_black",
    change: 50,
    reason: "توريد مخزون جديد",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "log_2",
    productItemId: "item_iphone15_256_black",
    change: -8,
    reason: "مبيعات طلبات",
    createdAt: "2026-06-10T12:30:00.000Z",
  },
  {
    id: "log_3",
    productItemId: "item_dell_xps_16_512",
    change: 10,
    reason: "توريد مخزون جديد",
    createdAt: "2026-06-02T11:15:00.000Z",
  },
  {
    id: "log_4",
    productItemId: "item_dell_xps_16_512",
    change: -6,
    reason: "مبيعات طلبات",
    createdAt: "2026-06-12T16:45:00.000Z",
  },
  {
    id: "log_5",
    productItemId: "item_women_dress_m",
    change: 20,
    reason: "توريد مخزون جديد",
    createdAt: "2026-06-03T10:00:00.000Z",
  },
  {
    id: "log_6",
    productItemId: "item_women_dress_m",
    change: -17,
    reason: "مبيعات طلبات",
    createdAt: "2026-06-14T13:20:00.000Z",
  },
  {
    id: "log_7",
    productItemId: "item_coffee_maker_std",
    change: 15,
    reason: "توريد مخزون جديد",
    createdAt: "2026-06-04T08:30:00.000Z",
  },
  {
    id: "log_8",
    productItemId: "item_coffee_maker_std",
    change: -15,
    reason: "مبيعات طلبات",
    createdAt: "2026-06-15T19:10:00.000Z",
  },
  {
    id: "log_9",
    productItemId: "item_galaxy_s24_256",
    change: 35,
    reason: "تعديل جرد",
    createdAt: "2026-06-05T14:00:00.000Z",
  },
];

export function getInventoryLogsByItemId(
  productItemId: string,
): InventoryLog[] {
  return inventoryLogs.filter((l) => l.productItemId === productItemId);
}
