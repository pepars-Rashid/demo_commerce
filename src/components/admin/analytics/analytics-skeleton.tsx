import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Where a chart will stream in — keeps the static shell shaped correctly. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/** Light lines for KPI values / short lists. */
export function ValueSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

/** Row placeholder for the best-sellers list. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
