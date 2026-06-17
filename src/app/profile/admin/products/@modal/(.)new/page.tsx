import { ProductFormSheet } from "@/components/admin/products/product-form-sheet";
import { categories } from "@/lib/mock/categories";

export default function InterceptedNewProductPage() {
  return <ProductFormSheet categories={categories} />;
}
