import { ProductFormSheet } from "@/components/admin/products/product-form-sheet";
import { getProductCategories } from "@/lib/actions/product";

export default async function InterceptedNewProductPage() {
  const categories = await getProductCategories();

  const mappedCategories = categories.map((c) => ({
    id: String(c.id),
    parentCategoryId: c.parentCategoryId ? String(c.parentCategoryId) : null,
    categoryName: c.categoryName,
    slug: c.slug,
    categoryImage: c.categoryImage,
  }));

  return <ProductFormSheet categories={mappedCategories} />;
}