import { Skeleton } from "@/components/ui/skeleton";
import type { BestTimeHeatmap as Matrix } from "@/services/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

interface Props {
  data?: Matrix;
  loading?: boolean;
}

/** Map 0..100 intensity to a primary-tinted background. */
function cellColor(v: number) {
  const alpha = 0.08 + (v / 100) * 0.92;
  return `hsl(230 100% 62% / ${alpha.toFixed(2)})`;
}

export function BestTimeHeatmap({ data, loading }: Props) {
  if (loading || !data) {
    return <Skeleton className="h-[220px] w-full" />;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Hour axis */}
        <div className="mb-1 flex pl-10">
          {Array.from({ length: 24 }).map((_, h) => (
            <div
              key={h}
              className="flex-1 text-center text-[10px] text-muted-foreground"
            >
              {HOUR_LABELS.includes(h) ? h : ""}
            </div>
          ))}
        </div>

        {data.map((row, day) => (
          <div key={day} className="flex items-center">
            <div className="w-10 text-xs font-medium text-muted-foreground">
              {DAYS[day]}
            </div>
            <div className="flex flex-1 gap-[2px]">
              {row.map((v, hour) => (
                <div
                  key={hour}
                  className="h-5 flex-1 rounded-[3px]"
                  style={{ backgroundColor: cellColor(v) }}
                  title={`${DAYS[day]} ${hour}:00 — engagement ${v}`}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[10, 35, 60, 85, 100].map((v) => (
            <span
              key={v}
              className="h-3 w-5 rounded-[3px]"
              style={{ backgroundColor: cellColor(v) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
