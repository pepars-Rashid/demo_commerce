import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const placeholderStats = [
  {
    title: "إجمالي المنتجات",
    value: "٠",
    icon: Package,
    description: "المنتجات النشطة في المتجر",
  },
  {
    title: "إجمالي الطلبات",
    value: "٠",
    icon: ShoppingCart,
    description: "جميع الطلبات",
  },
  {
    title: "الإيرادات",
    value: "٠ $",
    icon: DollarSign,
    description: "إجمالي الإيرادات",
  },
  {
    title: "المستخدمين",
    value: "٠",
    icon: Users,
    description: "المستخدمين المسجلين",
  },
  {
    title: "مخزون منخفض",
    value: "٠",
    icon: AlertCircle,
    description: "منتجات تحتاج إعادة تزويد",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">
            مرحباً بك في لوحة التحكم
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {placeholderStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
