"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts/types/polar/Pie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryTreeStats } from "@/lib/actions/analytics";
import { formatNumber } from "@/lib/admin-format";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryTreePie({ data }: { data: CategoryTreeStats }) {
  const id = "category-tree-pie";
  const [activeId, setActiveId] = React.useState<number | null>(
    data.roots[0]?.id ?? null,
  );
  const active = data.roots.find((r) => r.id === activeId) ?? data.roots[0];
  const activeIndex = React.useMemo(
    () => data.roots.findIndex((r) => r.id === active?.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active?.id, data.roots.length],
  );

  const chartData = React.useMemo(
    () =>
      data.roots.map((r, i) => ({
        id: r.id,
        name: r.name,
        count: r.productCount,
        pct: r.pct,
        fill: PALETTE[i % PALETTE.length],
      })),
    [data.roots],
  );

  const config: ChartConfig = React.useMemo(
    () => ({
      count: { label: "المنتجات" },
      ...Object.fromEntries(
        data.roots.map((r, i) => [
          r.name,
          { label: r.name, color: PALETTE[i % PALETTE.length] },
        ]),
      ),
    }),
    [data.roots],
  );

  const renderPieShape = React.useCallback(
    ({ index, outerRadius = 0, ...props }: PieSectorShapeProps) => {
      if (index === activeIndex) {
        return (
          <g>
            <Sector {...props} outerRadius={outerRadius + 10} />
            <Sector
              {...props}
              outerRadius={outerRadius + 25}
              innerRadius={outerRadius + 12}
            />
          </g>
        );
      }
      return <Sector {...props} outerRadius={outerRadius} />;
    },
    [activeIndex],
  );

  const children = active ? (data.childrenByRoot[active.id] ?? []) : [];


  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={config} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>المنتجات حسب الفئة</CardTitle>
          <CardDescription>النسبة من إجمالي المنتجات</CardDescription>
        </div>
        <Select
          value={active ? String(active.id) : ""}
          onValueChange={(v) => setActiveId(Number(v))}
        >
          <SelectTrigger
            className="ms-auto h-7 w-[130px] rounded-lg"
            aria-label="اختر فئة رئيسية"
          >
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {data.roots.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={config}
          dir="ltr"
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _n, item) => (
                    <span className="font-medium tabular-nums">
                      {String(item?.payload?.name)}:{" "}
                      {formatNumber(Number(value))} (
                      {formatNumber(
                        Math.round(Number(item?.payload?.pct ?? 0)),
                      )}
                      %)
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              shape={renderPieShape}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox && active) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {formatNumber(active.productCount)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {active.name}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {children.length > 0 && (
        <div className="space-y-2 px-4 pb-4">
          {children.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate text-muted-foreground">{c.name}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatNumber(c.productCount)} ({formatNumber(Math.round(c.pct))}
                %)
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
