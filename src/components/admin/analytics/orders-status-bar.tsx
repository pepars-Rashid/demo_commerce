"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { OrdersByStatusRow } from "@/lib/actions/analytics";
import { formatCurrency, formatNumber } from "@/lib/admin-format";

const STATUS_LABEL: Record<string, string> = {
  pending: "قيد الانتظار",
  paid: "مدفوع",
  shipped: "مشحون",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const chartConfig = {
  revenue: { label: "الإيرادات", color: "var(--chart-2)" },
  count: { label: "الطلبات", color: "var(--chart-4)" },
  label: { color: "var(--background)" },
} satisfies ChartConfig;

export function OrdersStatusBar({ data }: { data: OrdersByStatusRow[] }) {
  const chartData = data.map((r) => ({
    status: STATUS_LABEL[r.status] ?? r.status,
    revenue: Number(r.revenue),
    count: r.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>الطلبات حسب الحالة</CardTitle>
        <CardDescription>الإيرادات وعدد الطلبات لكل حالة</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} dir="ltr">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ right: 80 }}
            barCategoryGap="28%"
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={90}
              tick={{ fontSize: 12 }}
            />
            <XAxis dataKey="revenue" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) =>
                    name === "revenue" ? (
                      <span className="font-medium tabular-nums">
                        {formatCurrency(Number(value))}
                      </span>
                    ) : (
                      <span className="font-medium tabular-nums">
                        {formatNumber(Number(value))} طلب
                      </span>
                    )
                  }
                />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}>
              <LabelList
                dataKey="count"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(v: React.ReactNode) =>
                  `${formatNumber(Number(v))} طلب`
                }
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
