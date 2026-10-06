import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKpiStats } from "@/lib/actions/analytics";
import { formatCurrency, formatNumber } from "@/lib/admin-format";

/** Server island — streams the 4 KPI values into the static shell. */
export async function KpiCards() {
  const stats = await getKpiStats();

  const cards = [
    {
      title: "إجمالي المنتجات",
      value: formatNumber(stats.products),
      description: "المنتجات النشطة في المتجر",
      icon: Package,
    },
    {
      title: "إجمالي الطلبات",
      value: formatNumber(stats.orders),
      description: "جميع الطلبات",
      icon: ShoppingCart,
    },
    {
      title: "الإيرادات",
      value: formatCurrency(Number(stats.revenue)),
      description: "باستثناء الطلبات الملغاة",
      icon: DollarSign,
    },
    {
      title: "المستخدمين",
      value: formatNumber(stats.users),
      description: "المستخدمين المسجلين",
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
