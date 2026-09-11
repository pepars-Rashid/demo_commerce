import { CategoryFormSheet } from "@/components/admin/categories/category-form-sheet";
import {
  getCategoryById,
  getActiveCategories,
  getCategoryWithDescendants,
} from "@/lib/actions/category";
import { withCategoryDepth } from "@/lib/category-depth";

interface InterceptedEditCategoryPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function InterceptedEditCategoryPage({
  params,
  searchParams,
}: InterceptedEditCategoryPageProps) {
  const { id } = await params;
  const { view } = await searchParams;

  const categoryId = parseInt(id, 10);
  if (Number.isNaN(categoryId)) {
    return null;
  }

  const category = await getCategoryById(categoryId);
  if (!category) {
    return null;
  }

  const excluded = await getCategoryWithDescendants(categoryId);
  const all = await getActiveCategories();
  const options = withCategoryDepth(
    all.filter((c) => !excluded.has(c.id)),
  );

  return (
    <CategoryFormSheet
      options={options}
      category={{
        id: String(category.id),
        categoryName: category.categoryName,
        slug: category.slug,
        categoryImage: category.categoryImage,
        parentCategoryId: category.parentCategoryId,
      }}
      readOnly={view === "true"}
    />
  );
}
