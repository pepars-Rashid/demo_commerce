import { ProductFormSheet } from "@/components/admin/products/product-form-sheet";
import { categories } from "@/lib/mock/categories";
import {
  getProductById,
  getProductItemsByProductId,
} from "@/lib/mock/products";

interface InterceptedEditProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function InterceptedEditProductPage({
  params,
  searchParams,
}: InterceptedEditProductPageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const product = getProductById(id);

  if (!product) {
    return null;
  }

  return (
    <ProductFormSheet
      categories={categories}
      product={product}
      productItems={getProductItemsByProductId(product.id)}
      readOnly={view === "true"}
    />
  );
}