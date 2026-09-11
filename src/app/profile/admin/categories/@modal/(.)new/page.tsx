import { CategoryFormSheet } from "@/components/admin/categories/category-form-sheet";
import { getActiveCategories } from "@/lib/actions/category";

export default async function InterceptedNewCategoryPage() {
  const options = await getActiveCategories();

  return <CategoryFormSheet options={options} />;
}
