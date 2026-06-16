"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "./product-form";
import type {
  Product,
  ProductCategory,
  ProductItem,
} from "@/lib/mock/types";

interface ProductFormPageProps {
  categories: ProductCategory[];
  product?: Product;
  productItems?: ProductItem[];
}

export function ProductFormPage(props: ProductFormPageProps) {
  const router = useRouter();

  return (
    <ProductForm
      {...props}
      layout="page"
      onDone={() => router.push("/profile/admin/products")}
    />
  );
}
