import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBestSellers } from "@/lib/actions/analytics";
import { formatCurrency, formatNumber } from "@/lib/admin-format";

/** Server island — full-width top-5 by revenue, names link to product view. */
export async function BestSellers() {
  const rows = await getBestSellers(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>الأكثر مبيعاً</CardTitle>
        <p className="text-sm text-muted-foreground">
          أعلى 5 منتجات من حيث الإيرادات (باستثناء الملغاة)
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد مبيعات بعد</p>
        ) : (
          <ul className="divide-y">
            {rows.map((r, i) => (
              <li
                key={r.productId}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground">
                    {formatNumber(i + 1)}
                  </span>
                  <Link
                    href={`/profile/admin/products/${r.productId}?view=true`}
                    className="truncate text-sm font-medium underline underline-offset-4"
                  >
                    {r.name}
                  </Link>
                </div>
                <div className="flex shrink-0 items-center gap-6 text-sm">
                  <span className="text-muted-foreground">
                    {formatNumber(r.units)} وحدة
                  </span>
                  <span className="font-bold">
                    {formatCurrency(Number(r.revenue))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
