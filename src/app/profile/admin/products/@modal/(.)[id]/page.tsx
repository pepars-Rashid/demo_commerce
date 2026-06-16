import { ProductFormSheet } from "@/components/admin/products/product-form-sheet";
import { categories } from "@/lib/mock/categories";
import {
  getProductById,
  getProductItemsByProductId,
} from "@/lib/mock/products";

export default async function InterceptedEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return null;
  }

  return (
    <ProductFormSheet
      categories={categories}
      product={product}
      productItems={getProductItemsByProductId(product.id)}
    />
  );
}
