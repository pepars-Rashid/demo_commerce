import { Suspense } from "react";
import { getProducts, getProductCategories } from "@/lib/actions/product";
import { ProductListClient } from "@/components/admin/products/product-list-client";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const sp = await searchParams;

  const page = parseInt(sp.page ?? "1", 10) || 1;
  const search = sp.search ?? "";
  const categoryId = sp.categoryId ? parseInt(sp.categoryId, 10) : null;

  const [data, categories] = await Promise.all([
    getProducts({
      page,
      pageSize: 10,
      search: search || undefined,
      categoryId: Number.isNaN(categoryId) ? null : categoryId,
    }),
    getProductCategories(),
  ]);

  return (
    <Suspense fallback={null}>
      <ProductListClient
        initialData={data}
        categories={categories}
        searchValue={search}
        categoryIdValue={categoryId != null ? String(categoryId) : "all"}
      />
    </Suspense>
  );
}