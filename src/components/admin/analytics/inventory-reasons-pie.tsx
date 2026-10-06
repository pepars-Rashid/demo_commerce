"use client";

import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { InventoryByReasonRow } from "@/lib/actions/analytics";
import { formatNumber } from "@/lib/admin-format";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function InventoryReasonsPie({ data }: { data: InventoryByReasonRow[] }) {
  const chartData = data.map((r, i) => ({
    reason: r.reason,
    magnitude: r.magnitude,
    fill: PALETTE[i % PALETTE.length],
  }));

  const config: ChartConfig = {
    magnitude: { label: "الحركة" },
    ...Object.fromEntries(
      data.map((r, i) => [
        r.reason,
        { label: r.reason, color: PALETTE[i % PALETTE.length] },
      ]),
    ),
  };

  const stockIn = data.reduce((s, r) => s + r.stockIn, 0);
  const stockOut = data.reduce((s, r) => s + r.stockOut, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>حركة المخزون حسب السبب</CardTitle>
        <CardDescription>الحصة من إجمالي الحركة (داخل + خارج)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          dir="ltr"
          className="mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item?.payload?.reason}</span>
                      <span className="font-medium tabular-nums">
                        {formatNumber(Number(value))} وحدة (
                        {formatNumber(
                          Number(item?.payload?.pct ?? 0),
                        )}
                        %)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData.map((d, i) => ({
                ...d,
                pct: data[i]?.pct ?? 0,
              }))}
              dataKey="magnitude"
              nameKey="reason"
              innerRadius={55}
              strokeWidth={2}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="reason" />}
              className="flex-wrap gap-x-4 gap-y-1.5"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          داخل: {formatNumber(stockIn)} — خارج: {formatNumber(stockOut)}
        </div>
      </CardFooter>
    </Card>
  );
}
