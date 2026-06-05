import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDelta } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  changePct?: number;
  icon: LucideIcon;
  loading?: boolean;
  /** Inverts color meaning (e.g. for "cost" metrics). Not used here but handy. */
  invert?: boolean;
}

export function KpiCard({
  label,
  value,
  changePct,
  icon: Icon,
  loading,
  invert,
}: Props) {
  const up = (changePct ?? 0) >= 0;
  const good = invert ? !up : up;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <span className="rounded-lg bg-accent p-2 text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
        </div>

        {loading ? (
          <Skeleton className="mt-3 h-8 w-28" />
        ) : (
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
        )}

        {loading ? (
          <Skeleton className="mt-2 h-4 w-20" />
        ) : changePct !== undefined ? (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-sm font-medium",
              good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {up ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {formatDelta(changePct)}
            <span className="font-normal text-muted-foreground">
              vs prev period
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
