import type { OrderLine, ShopOrder } from "./types";

export const shopOrders: ShopOrder[] = [
  {
    id: "order_1001",
    userId: "user_sara",
    orderDate: "2026-06-12T10:24:00.000Z",
    orderTotal: 9598,
    orderStatus: "delivered",
    shippingAddress: "حي الياسمين، شارع الأمير محمد، الرياض 13325",
    billingAddress: "حي الياسمين، شارع الأمير محمد، الرياض 13325",
  },
  {
    id: "order_1002",
    userId: "user_khaled",
    orderDate: "2026-06-13T14:05:00.000Z",
    orderTotal: 3599,
    orderStatus: "shipped",
    shippingAddress: "حي النخيل، طريق الملك فهد، جدة 23442",
    billingAddress: "حي النخيل، طريق الملك فهد، جدة 23442",
  },
  {
    id: "order_1003",
    userId: "user_noura",
    orderDate: "2026-06-14T09:40:00.000Z",
    orderTotal: 5499,
    orderStatus: "paid",
    shippingAddress: "حي العزيزية، شارع التحلية، الدمام 32424",
    billingAddress: "حي العزيزية، شارع التحلية، الدمام 32424",
  },
  {
    id: "order_1004",
    userId: "user_reem",
    orderDate: "2026-06-15T18:15:00.000Z",
    orderTotal: 598,
    orderStatus: "pending",
    shippingAddress: "حي الروضة، شارع الستين، الرياض 12831",
    billingAddress: "حي الروضة، شارع الستين، الرياض 12831",
  },
  {
    id: "order_1005",
    userId: "user_sara",
    orderDate: "2026-06-15T20:50:00.000Z",
    orderTotal: 799,
    orderStatus: "cancelled",
    shippingAddress: "حي الياسمين، شارع الأمير محمد، الرياض 13325",
    billingAddress: "حي الياسمين، شارع الأمير محمد، الرياض 13325",
  },
  {
    id: "order_1006",
    userId: "user_khaled",
    orderDate: "2026-06-16T08:30:00.000Z",
    orderTotal: 4799,
    orderStatus: "paid",
    shippingAddress: "حي النخيل، طريق الملك فهد، جدة 23442",
    billingAddress: "حي النخيل، طريق الملك فهد، جدة 23442",
  },
];

export const orderLines: OrderLine[] = [
  {
    id: "line_1",
    orderId: "order_1001",
    productItemId: "item_iphone15_256_black",
    qty: 1,
    price: 4799,
    },
  {
    id: "line_2",
    orderId: "order_1001",
    productItemId: "item_dell_xps_16_512",
    qty: 1,
    price: 3999,
  },
  {
    id: "line_3",
    orderId: "order_1001",
    productItemId: "item_men_jacket_l",
    qty: 2,
    price: 299,
  },
  {
    id: "line_4",
    orderId: "order_1002",
    productItemId: "item_galaxy_s24_256",
    qty: 1,
    price: 3599,
  },
  {
    id: "line_5",
    orderId: "order_1003",
    productItemId: "item_macbook_air_8_256",
    qty: 1,
    price: 5499,
  },
  {
    id: "line_6",
    orderId: "order_1004",
    productItemId: "item_men_jacket_l",
    qty: 2,
    price: 299,
  },
  {
    id: "line_7",
    orderId: "order_1005",
    productItemId: "item_coffee_maker_std",
    qty: 1,
    price: 799,
  },
  {
    id: "line_8",
    orderId: "order_1006",
    productItemId: "item_iphone15_256_black",
    qty: 1,
    price: 4799,
  },
];

export function getOrderById(id: string): ShopOrder | undefined {
  return shopOrders.find((o) => o.id === id);
}

export function getOrderLinesByOrderId(orderId: string): OrderLine[] {
  return orderLines.filter((l) => l.orderId === orderId);
}
