// Mock data types — field names match the database schema exactly so that
// real Drizzle queries can be swapped in later without refactoring the UI.

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export type UserRole = "user" | "superAdmin";

export interface ProductCategory {
  id: string;
  parentCategoryId: string | null;
  categoryName: string;
  slug: string;
  categoryImage: string | null;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: number;
  productImage: string | null;
}

export interface ProductItem {
  id: string;
  productId: string;
  sku: string;
  qtyInStock: number;
  reservedStock: number;
  price: number;
  discountPrice: number | null;
  images: string[];
  variantsJson: Record<string, string>;
}

export interface ShopOrder {
  id: string;
  userId: string;
  orderDate: string;
  orderTotal: number;
  orderStatus: OrderStatus;
  shippingAddress: string;
  billingAddress: string;
}

export interface OrderLine {
  id: string;
  productItemId: string;
  orderId: string;
  qty: number;
  price: number;
}

export interface InventoryLog {
  id: string;
  productItemId: string;
  change: number;
  reason: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
}
