import { Info } from "lucide-react";
import { useIsReal } from "@/store/useAuthStore";

/**
 * Shown on analytics surfaces in real mode: the charts below still run on
 * demo data until the snapshot pipeline has collected enough real history.
 */
export function AnalyticsDemoNotice() {
  const isReal = useIsReal();
  if (!isReal) return null;
  return (
    <div className="no-print flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        The charts below are demo data for now. Real Instagram/TikTok analytics
        are collected daily from your connected accounts and will replace these
        once enough history exists.
      </span>
    </div>
  );
}
