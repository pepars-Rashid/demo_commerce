import type { Product, ProductItem } from "./types";

export const products: Product[] = [
  {
    id: "prod_iphone15",
    categoryId: "cat_phones",
    name: "آيفون 15 برو",
    description: "هاتف ذكي بشريحة A17 Pro وكاميرا احترافية ثلاثية.",
    basePrice: 4999,
    productImage: null,
  },
  {
    id: "prod_galaxy_s24",
    categoryId: "cat_phones",
    name: "سامسونج جالاكسي S24",
    description: "شاشة Dynamic AMOLED وأداء فائق مع ميزات الذكاء الاصطناعي.",
    basePrice: 3799,
    productImage: null,
  },
  {
    id: "prod_macbook_air",
    categoryId: "cat_laptops",
    name: "ماك بوك إير M3",
    description: "حاسوب محمول خفيف الوزن بمعالج M3 وبطارية تدوم طوال اليوم.",
    basePrice: 5499,
    productImage: null,
  },
  {
    id: "prod_dell_xps",
    categoryId: "cat_laptops",
    name: "ديل XPS 13",
    description: "تصميم أنيق وشاشة InfinityEdge عالية الدقة.",
    basePrice: 4299,
    productImage: null,
  },
  {
    id: "prod_men_jacket",
    categoryId: "cat_men",
    name: "جاكيت رجالي شتوي",
    description: "جاكيت دافئ مقاوم للماء بتصميم عصري.",
    basePrice: 349,
    productImage: null,
  },
  {
    id: "prod_women_dress",
    categoryId: "cat_women",
    name: "فستان نسائي صيفي",
    description: "فستان قطني مريح بألوان زاهية.",
    basePrice: 229,
    productImage: null,
  },
  {
    id: "prod_coffee_maker",
    categoryId: "cat_home",
    name: "ماكينة قهوة أوتوماتيكية",
    description: "تحضير قهوة احترافية بلمسة زر واحدة.",
    basePrice: 899,
    productImage: null,
  },
];

export const productItems: ProductItem[] = [
  {
    id: "item_iphone15_256_black",
    productId: "prod_iphone15",
    sku: "IP15P-256-BLK",
    qtyInStock: 42,
    reservedStock: 5,
    price: 4999,
    discountPrice: 4799,
    images: [],
    variantsJson: { التخزين: "256GB", اللون: "أسود" },
  },
  {
    id: "item_iphone15_512_blue",
    productId: "prod_iphone15",
    sku: "IP15P-512-BLU",
    qtyInStock: 18,
    reservedStock: 2,
    price: 5799,
    discountPrice: null,
    images: [],
    variantsJson: { التخزين: "512GB", اللون: "أزرق" },
  },
  {
    id: "item_galaxy_s24_256",
    productId: "prod_galaxy_s24",
    sku: "SGS24-256-GRY",
    qtyInStock: 30,
    reservedStock: 4,
    price: 3799,
    discountPrice: 3599,
    images: [],
    variantsJson: { التخزين: "256GB", اللون: "رمادي" },
  },
  {
    id: "item_macbook_air_8_256",
    productId: "prod_macbook_air",
    sku: "MBA-M3-8-256",
    qtyInStock: 12,
    reservedStock: 1,
    price: 5499,
    discountPrice: null,
    images: [],
    variantsJson: { الذاكرة: "8GB", التخزين: "256GB" },
  },
  {
    id: "item_dell_xps_16_512",
    productId: "prod_dell_xps",
    sku: "XPS13-16-512",
    qtyInStock: 4,
    reservedStock: 0,
    price: 4299,
    discountPrice: 3999,
    images: [],
    variantsJson: { الذاكرة: "16GB", التخزين: "512GB" },
  },
  {
    id: "item_men_jacket_l",
    productId: "prod_men_jacket",
    sku: "MJKT-L-NVY",
    qtyInStock: 60,
    reservedStock: 8,
    price: 349,
    discountPrice: 299,
    images: [],
    variantsJson: { المقاس: "L", اللون: "كحلي" },
  },
  {
    id: "item_women_dress_m",
    productId: "prod_women_dress",
    sku: "WDRS-M-RED",
    qtyInStock: 3,
    reservedStock: 1,
    price: 229,
    discountPrice: null,
    images: [],
    variantsJson: { المقاس: "M", اللون: "أحمر" },
  },
  {
    id: "item_coffee_maker_std",
    productId: "prod_coffee_maker",
    sku: "CFM-STD-SLV",
    qtyInStock: 0,
    reservedStock: 0,
    price: 899,
    discountPrice: 799,
    images: [],
    variantsJson: { اللون: "فضي" },
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductItemsByProductId(productId: string): ProductItem[] {
  return productItems.filter((i) => i.productId === productId);
}

export function getProductItemById(id: string): ProductItem | undefined {
  return productItems.find((i) => i.id === id);
}

export function getProductName(productId: string): string {
  return products.find((p) => p.id === productId)?.name ?? "—";
}

// Total stock for a product across all of its items.
export function getProductTotalStock(productId: string): number {
  return getProductItemsByProductId(productId).reduce(
    (sum, item) => sum + item.qtyInStock,
    0,
  );
}
