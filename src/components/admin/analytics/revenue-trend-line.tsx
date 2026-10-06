"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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
import type { RevenueTrendPoint } from "@/lib/actions/analytics";
import { formatCurrency, formatDate, formatNumber } from "@/lib/admin-format";

const chartConfig = {
  revenue: { label: "الإيرادات", color: "var(--chart-1)" },
  orders: { label: "الطلبات", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Metric = "revenue" | "orders";

export function RevenueTrendLine({ data }: { data: RevenueTrendPoint[] }) {
  const [active, setActive] = React.useState<Metric>("revenue");

  const totals = React.useMemo(
    () => ({
      revenue: data.reduce((s, p) => s + p.revenue, 0),
      orders: data.reduce((s, p) => s + p.orders, 0),
    }),
    [data],
  );

  const fmtTick = (value: string) => {
    const d = new Date(`${value}T00:00:00Z`);
    return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
      month: "short",
      day: "numeric",
    }).format(d);
  };

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>الإيرادات عبر الزمن</CardTitle>
          <CardDescription>نطاق البيانات المزروعة (ثابت)</CardDescription>
        </div>
        <div className="flex">
          {(["revenue", "orders"] as Metric[]).map((key) => (
            <button
              key={key}
              data-active={active === key}
              className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-s sm:px-8 sm:py-6"
              onClick={() => setActive(key)}
            >
              <span className="text-xs text-muted-foreground">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {key === "revenue"
                  ? formatCurrency(totals.revenue)
                  : formatNumber(totals.orders)}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          dir="ltr"
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={fmtTick}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => formatDate(`${value}T00:00:00Z`)}
                  formatter={(value, name) => (
                    <span className="font-medium tabular-nums">
                      {name === "revenue"
                        ? formatCurrency(Number(value))
                        : `${formatNumber(Number(value))} طلب`}
                    </span>
                  )}
                />
              }
            />
            <Line
              dataKey={active}
              type="monotone"
              stroke={`var(--color-${active})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
