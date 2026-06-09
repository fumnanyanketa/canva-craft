import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NetworkIcon } from "@/components/NetworkIcon";
import { useProfiles } from "@/hooks/useSocialData";
import { useAccounts } from "@/hooks/useRealData";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore, useIsReal } from "@/store/useAuthStore";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileSwitcher() {
  const isReal = useIsReal();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Demo data (only fetched in demo mode) / real accounts (only in real mode).
  const { data: profiles } = useProfiles();
  const { data: accountData } = useAccounts(isReal);

  const profileId = useAppStore((s) => s.profileId);
  const setProfile = useAppStore((s) => s.setProfile);

  if (isReal) {
    const accounts = accountData?.accounts ?? [];
    const label = user?.name || user?.email || "My workspace";
    return (
      <Button
        variant="outline"
        className="h-12 justify-between gap-2 px-2 sm:min-w-[220px]"
        onClick={() => navigate("/settings/accounts")}
        title="Manage connected accounts"
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <Avatar className="h-8 w-8">
            <AvatarFallback style={{ backgroundColor: "#3b5bff" }}>
              {initials(label)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden flex-col items-start overflow-hidden text-left sm:flex">
            <span className="w-full truncate text-sm font-semibold">
              {label}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {accounts.length > 0 ? (
                accounts
                  .slice(0, 5)
                  .map((a) => (
                    <NetworkIcon key={a.id} network={a.platform} size={12} />
                  ))
              ) : (
                <span>Connect accounts →</span>
              )}
            </span>
          </span>
        </span>
        <Settings2 className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  const active = profiles?.find((p) => p.id === profileId) ?? profiles?.[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-12 justify-between gap-2 px-2 sm:min-w-[220px]"
        >
          <span className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                style={{ backgroundColor: active?.color ?? "#3b5bff" }}
              >
                {active ? initials(active.name) : "·"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start overflow-hidden text-left sm:flex">
              <span className="w-full truncate text-sm font-semibold">
                {active?.name ?? "Select brand"}
              </span>
              <span className="text-xs text-muted-foreground">
                {active?.handle}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        <DropdownMenuLabel>Brands</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles?.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setProfile(p.id)}
            className="gap-2 py-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback style={{ backgroundColor: p.color }}>
                {initials(p.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">{p.name}</span>
              <span className="flex items-center gap-1">
                {p.networks.slice(0, 5).map((n) => (
                  <NetworkIcon key={n} network={n} size={12} />
                ))}
              </span>
            </div>
            {p.id === active?.id && (
              <Check className="ml-auto h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
