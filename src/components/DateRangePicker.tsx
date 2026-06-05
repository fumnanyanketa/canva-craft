import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore, type RangePreset } from "@/store/useAppStore";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "28d", label: "Last 28 days" },
  { value: "90d", label: "Last 90 days" },
];

export function DateRangePicker() {
  const preset = useAppStore((s) => s.preset);
  const range = useAppStore((s) => s.range);
  const setPreset = useAppStore((s) => s.setPreset);

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
        <SelectTrigger className="h-12 w-[160px]">
          <CalendarIcon className="mr-1 h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="hidden text-xs text-muted-foreground lg:inline">
        {format(parseISO(range.from), "MMM d")} –{" "}
        {format(parseISO(range.to), "MMM d, yyyy")}
      </span>
    </div>
  );
}
