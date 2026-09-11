import { Suspense } from "react";
import { getCategories } from "@/lib/actions/category";
import { CategoryListClient } from "@/components/admin/categories/category-list-client";

interface CategoriesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    archived?: string;
  }>;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const sp = await searchParams;

  const page = parseInt(sp.page ?? "1", 10) || 1;
  const search = sp.search ?? "";
  const onlyArchived = sp.archived === "true";

  const data = await getCategories({
    page,
    pageSize: 10,
    search: search || undefined,
    onlyArchived,
  });

  return (
    <Suspense fallback={null}>
      <CategoryListClient
        initialData={data}
        onlyArchivedValue={onlyArchived ? "true" : "false"}
        searchValue={search}
      />
    </Suspense>
  );
}
