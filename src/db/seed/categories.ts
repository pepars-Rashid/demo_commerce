import { db } from "@/db/db";
import { productCategory } from "@/db/schema";
import { catalogTree, collectLeaves, type LeafConfig, type CategoryNode } from "./catalog-config";

/** Insert the category tree (parents first) and return leaf path → category id. */
export async function seedCategories(): Promise<Map<string, number>> {
  const leafIdByPath = new Map<string, number>();

  async function insertNode(node: CategoryNode, parentId: number | null, path: string) {
    const [row] = await db
      .insert(productCategory)
      .values({
        parentCategoryId: parentId,
        categoryName: node.name,
        slug: path,
        categoryImage: null,
      })
      .returning({ id: productCategory.id });

    if (node.children) {
      for (const child of node.children) {
        await insertNode(child, row.id, `${path}/${child.slugPart}`);
      }
    }
    if (node.leaf) {
      leafIdByPath.set(path, row.id);
    }
  }

  for (const root of catalogTree) {
    await insertNode(root, null, root.slugPart);
  }

  console.log(`✅ ${collectLeaves().length} leaf categories seeded`);
  return leafIdByPath;
}

/** Utility to read a leaf's config from a given path (used by products.ts). */
export function findLeaf(path: string): LeafConfig | undefined {
  return collectLeaves().find((l) => l.path === path);
}