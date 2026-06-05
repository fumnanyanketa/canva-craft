import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, subDays } from "date-fns";
import type { DateRange } from "@/services/types";

export type RangePreset = "7d" | "28d" | "90d";

function rangeFromPreset(preset: RangePreset): DateRange {
  const to = new Date();
  const days = preset === "7d" ? 6 : preset === "28d" ? 27 : 89;
  return {
    from: format(subDays(to, days), "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

interface AppState {
  profileId: string;
  preset: RangePreset;
  range: DateRange;
  theme: "light" | "dark";
  setProfile: (id: string) => void;
  setPreset: (preset: RangePreset) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profileId: "p-aurora",
      preset: "28d",
      range: rangeFromPreset("28d"),
      theme: "light",
      setProfile: (id) => set({ profileId: id }),
      setPreset: (preset) => set({ preset, range: rangeFromPreset(preset) }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    {
      name: "metricool-lite:app",
      // Recompute range on load so "last 28d" stays relative to today.
      onRehydrateStorage: () => (state) => {
        if (state) state.range = rangeFromPreset(state.preset);
      },
    }
  )
);

export { rangeFromPreset };
