import { ProductFormSheet } from "@/components/admin/products/product-form-sheet";
import { getProductById, getProductCategories } from "@/lib/actions/product";

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

  const productId = parseInt(id, 10);
  if (Number.isNaN(productId)) {
    return null;
  }

  const [product, categories] = await Promise.all([
    getProductById(productId),
    getProductCategories(),
  ]);

  if (!product) {
    return null;
  }

  const mappedCategories = categories.map((c) => ({
    id: String(c.id),
    parentCategoryId: c.parentCategoryId ? String(c.parentCategoryId) : null,
    categoryName: c.categoryName,
    slug: c.slug,
    categoryImage: c.categoryImage,
  }));

  return (
    <ProductFormSheet
      categories={mappedCategories}
      product={{
        id: String(product.id),
        categoryId: String(product.categoryId),
        name: product.name,
        description: product.description,
        basePrice: Number(product.basePrice),
        totalStock: product.totalStock,
        productImage: product.productImage,
      }}
      productItems={product.items.map((i) => ({
        id: String(i.id),
        productId: String(i.productId),
        sku: i.sku ?? "",
        qtyInStock: i.qtyInStock,
        reservedStock: i.reservedStock,
        price: Number(i.price),
        discountPrice: i.discountPrice ? Number(i.discountPrice) : null,
        images: i.images,
        variantsJson: i.variantsJson,
      }))}
      readOnly={view === "true"}
    />
  );
}