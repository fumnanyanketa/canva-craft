import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Moon, Plus, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { DateRangePicker } from "@/components/DateRangePicker";
import { PostComposer } from "@/components/PostComposer";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/analytics", label: "Analytics" },
  { to: "/calendar", label: "Planning" },
  { to: "/reports", label: "Reports" },
];

export function TopBar() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <ProfileSwitcher />

        <div className="ml-auto flex items-center gap-2">
          <DateRangePicker />
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button className="h-12" onClick={() => setComposerOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New post</span>
          </Button>
        </div>
      </div>

      {/* Mobile nav (sidebar is hidden below md) */}
      <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 md:hidden">
        {MOBILE_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <PostComposer open={composerOpen} onOpenChange={setComposerOpen} />
    </header>
  );
}
