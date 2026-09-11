import { CategoryFormSheet } from "@/components/admin/categories/category-form-sheet";
import { getActiveCategories } from "@/lib/actions/category";
import { withCategoryDepth } from "@/lib/category-depth";

export default async function InterceptedNewCategoryPage() {
  const options = withCategoryDepth(await getActiveCategories());

  return <CategoryFormSheet options={options} />;
}
