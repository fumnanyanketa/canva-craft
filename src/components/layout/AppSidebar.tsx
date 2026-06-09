import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  FileBarChart,
  Plug,
} from "lucide-react";
import { useIsReal } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/calendar", label: "Planning", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings/accounts", label: "Accounts", icon: Plug },
];

export function AppSidebar() {
  const isReal = useIsReal();
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold tracking-tight">
          Metricool<span className="text-primary"> Lite</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4 text-xs text-muted-foreground">
        {isReal ? (
          <>
            <p className="font-medium text-foreground">Live mode</p>
            <p className="mt-1">
              Scheduled posts publish to your connected accounts automatically.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">Demo data</p>
            <p className="mt-1">
              All metrics are simulated. Sign in to connect real accounts.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
