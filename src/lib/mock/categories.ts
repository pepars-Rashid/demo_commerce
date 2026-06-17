import type { ProductCategory } from "./types";

export const categories: ProductCategory[] = [
  {
    id: "cat_electronics",
    parentCategoryId: null,
    categoryName: "إلكترونيات",
    slug: "electronics",
    categoryImage: null,
  },
  {
    id: "cat_phones",
    parentCategoryId: "cat_electronics",
    categoryName: "هواتف ذكية",
    slug: "smartphones",
    categoryImage: null,
  },
  {
    id: "cat_laptops",
    parentCategoryId: "cat_electronics",
    categoryName: "حواسيب محمولة",
    slug: "laptops",
    categoryImage: null,
  },
  {
    id: "cat_fashion",
    parentCategoryId: null,
    categoryName: "أزياء",
    slug: "fashion",
    categoryImage: null,
  },
  {
    id: "cat_men",
    parentCategoryId: "cat_fashion",
    categoryName: "ملابس رجالية",
    slug: "men-clothing",
    categoryImage: null,
  },
  {
    id: "cat_women",
    parentCategoryId: "cat_fashion",
    categoryName: "ملابس نسائية",
    slug: "women-clothing",
    categoryImage: null,
  },
  {
    id: "cat_home",
    parentCategoryId: null,
    categoryName: "المنزل والمطبخ",
    slug: "home-kitchen",
    categoryImage: null,
  },
];

export function getCategoryName(categoryId: string | null): string {
  if (!categoryId) return "—";
  return categories.find((c) => c.id === categoryId)?.categoryName ?? "—";
}

export function getCategoryById(
  categoryId: string,
): ProductCategory | undefined {
  return categories.find((c) => c.id === categoryId);
}
