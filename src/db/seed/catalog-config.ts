/**
 * Single source of truth for the seeded catalog.
 *
 * Tree: 3 roots, 10 leaf categories (clothing is 3 deep, electronics/beauty 2).
 * Each leaf maps to a DummyJSON category (its `picks` are DummyJSON product ids)
 * plus the variant dimensions + per-product SKU counts used to generate items.
 */

export interface VariantDim {
  name: string; // dimension key stored in `variation.name` and `variantsJson`
  values: string[];
}

export interface LeafConfig {
  name: string; // Arabic category name
  dummySlug: string; // DummyJSON category slug
  picks: number[]; // DummyJSON product ids to include
  dims: VariantDim[];
  skuCounts: number[]; // how many SKUs per product (in `picks` order)
  hasColor?: boolean; // when true, per-color variants carry the product gallery
}

export interface CategoryNode {
  name: string; // Arabic
  slugPart: string; // url-safe segment
  children?: CategoryNode[];
  leaf?: LeafConfig; // present on leaf nodes
}

export const catalogTree: CategoryNode[] = [
  {
    name: "الملابس",
    slugPart: "clothing",
    children: [
      {
        name: "رجالي",
        slugPart: "men",
        children: [
          {
            name: "قمصان رجالية",
            slugPart: "shirts",
            leaf: {
              name: "قمصان رجالية",
              dummySlug: "mens-shirts",
              picks: [83, 85, 87],
              dims: [
                { name: "Size", values: ["S", "M", "L", "XL"] },
                { name: "Color", values: ["Blue", "Grey", "Cream"] },
              ],
              skuCounts: [4, 3, 3],
              hasColor: true,
            },
          },
          {
            name: "أحذية رجالية",
            slugPart: "shoes",
            leaf: {
              name: "أحذية رجالية",
              dummySlug: "mens-shoes",
              picks: [88, 90],
              dims: [
                { name: "Size", values: ["40", "41", "42", "43", "44"] },
                { name: "Color", values: ["Black", "White"] },
              ],
              skuCounts: [2, 2],
              hasColor: true,
            },
          },
        ],
      },
      {
        name: "نسائي",
        slugPart: "women",
        children: [
          {
            name: "حقائب نسائية",
            slugPart: "bags",
            leaf: {
              name: "حقائب نسائية",
              dummySlug: "womens-bags",
              picks: [172, 174, 176],
              dims: [{ name: "Color", values: ["Black", "Beige", "Brown", "Blue"] }],
              skuCounts: [3, 3, 3],
              hasColor: true,
            },
          },
          {
            name: "فساتين نسائية",
            slugPart: "dresses",
            leaf: {
              name: "فساتين نسائية",
              dummySlug: "womens-dresses",
              picks: [177, 178, 181],
              dims: [
                { name: "Size", values: ["S", "M", "L", "XL"] },
                { name: "Color", values: ["Black", "Red", "White"] },
              ],
              skuCounts: [4, 4, 3],
              hasColor: true,
            },
          },
          {
            name: "أحذية نسائية",
            slugPart: "shoes",
            leaf: {
              name: "أحذية نسائية",
              dummySlug: "womens-shoes",
              picks: [186, 187, 188],
              dims: [
                { name: "Size", values: ["36", "37", "38", "39", "40", "41"] },
                { name: "Color", values: ["Black", "Nude", "Gold"] },
              ],
              skuCounts: [3, 3, 3],
              hasColor: true,
            },
          },
        ],
      },
    ],
  },
  {
    name: "الإلكترونيات",
    slugPart: "electronics",
    children: [
      {
        name: "هواتف ذكية",
        slugPart: "smartphones",
        leaf: {
          name: "هواتف ذكية",
          dummySlug: "smartphones",
          picks: [121, 122, 133],
          dims: [
            { name: "Storage", values: ["64GB", "128GB", "256GB"] },
            { name: "Color", values: ["Black", "Silver", "Blue"] },
          ],
          skuCounts: [2, 2, 2],
          hasColor: true,
        },
      },
      {
        name: "إكسسوارات الجوال",
        slugPart: "mobile-accessories",
        leaf: {
          name: "إكسسوارات الجوال",
          dummySlug: "mobile-accessories",
          picks: [100, 104, 106],
          dims: [{ name: "Color", values: ["White", "Black", "Gray"] }],
          skuCounts: [2, 2, 2],
          hasColor: true,
        },
      },
      {
        name: "أجهزة محمولة",
        slugPart: "laptops",
        leaf: {
          name: "أجهزة محمولة",
          dummySlug: "laptops",
          picks: [78, 80, 82],
          dims: [
            { name: "RAM", values: ["8GB", "16GB", "32GB"] },
            { name: "Storage", values: ["256GB", "512GB", "1TB"] },
          ],
          skuCounts: [2, 2, 2],
        },
      },
    ],
  },
  {
    name: "الجمال والعناية",
    slugPart: "beauty",
    children: [
      {
        name: "عطور",
        slugPart: "fragrances",
        leaf: {
          name: "عطور",
          dummySlug: "fragrances",
          picks: [6, 8, 10],
          dims: [{ name: "Size", values: ["50ml", "100ml", "200ml"] }],
          skuCounts: [3, 2, 2],
        },
      },
      {
        name: "مستحضرات تجميل",
        slugPart: "makeup",
        leaf: {
          name: "مستحضرات تجميل",
          dummySlug: "beauty",
          picks: [1, 2, 4],
          dims: [{ name: "Shade", values: ["Black", "Brown", "Red", "Nude"] }],
          skuCounts: [3, 2, 2],
          hasColor: true,
        },
      },
    ],
  },
];
/** Flatten the tree into leaf configs with their full slug path. */
export interface FlatLeaf extends LeafConfig {
  path: string;
}

export function collectLeaves(): FlatLeaf[] {
  const out: FlatLeaf[] = [];
  function walk(nodes: CategoryNode[], prefix: string) {
    for (const node of nodes) {
      const path = prefix ? `${prefix}/${node.slugPart}` : node.slugPart;
      if (node.leaf) out.push({ ...node.leaf, path });
      if (node.children) walk(node.children, path);
    }
  }
  walk(catalogTree, "");
  return out;
}