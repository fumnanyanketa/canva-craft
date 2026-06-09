import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Info, Loader2, Plug, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkIcon } from "@/components/NetworkIcon";
import { useAccounts, useDisconnectAccount, startConnect } from "@/hooks/useRealData";
import { useAuthStore, useIsReal } from "@/store/useAuthStore";
import { ApiError, type ApiPlatform } from "@/lib/api";
import { format, parseISO } from "date-fns";

const STATUS_TOASTS: Record<string, { ok: boolean; message: string }> = {
  success: { ok: true, message: "Account connected 🎉" },
  denied: { ok: false, message: "Connection cancelled on the platform" },
  error: { ok: false, message: "Connection failed — check the server logs" },
  invalid_state: { ok: false, message: "Session expired — try connecting again" },
  not_configured: {
    ok: false,
    message: "That platform isn't configured on the server yet",
  },
};

const PLATFORM_HELP: Record<ApiPlatform, string> = {
  instagram:
    "Requires an Instagram Business/Creator account linked to a Facebook Page.",
  tiktok:
    "Until the app passes TikTok's audit, posts publish as private (only you can see them).",
};

export function Accounts() {
  const isReal = useIsReal();
  const logout = useAuthStore((s) => s.logout);
  const [params, setParams] = useSearchParams();
  const { data, isLoading } = useAccounts(isReal);
  const disconnect = useDisconnectAccount();
  const [connecting, setConnecting] = useState<ApiPlatform | null>(null);

  // Surface the OAuth callback result (?connect=instagram&status=success).
  useEffect(() => {
    const status = params.get("status");
    if (!status) return;
    const t = STATUS_TOASTS[status];
    if (t) (t.ok ? toast.success : toast.error)(t.message);
    setParams({}, { replace: true });
  }, [params, setParams]);

  if (!isReal) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <Card>
          <CardHeader>
            <CardTitle>You're in demo mode</CardTitle>
            <CardDescription>
              Demo mode runs on generated data, so there are no real accounts to
              connect. Sign in to link your Instagram and TikTok and start
              publishing for real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => logout()}>Exit demo & sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const connect = async (platform: ApiPlatform) => {
    setConnecting(platform);
    try {
      await startConnect(platform); // redirects the browser on success
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not start the connection"
      );
      setConnecting(null);
    }
  };

  const accounts = data?.accounts ?? [];
  const available = data?.available ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">
          Link the social profiles this app should publish to.
        </p>
      </div>

      {/* Connected accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected</CardTitle>
          <CardDescription>
            Posts can be scheduled to any account listed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : accounts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nothing connected yet — add your first account below.
            </p>
          ) : (
            accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Avatar className="h-10 w-10">
                  {a.avatarUrl && <AvatarImage src={a.avatarUrl} />}
                  <AvatarFallback className="bg-primary">
                    {(a.username ?? a.platform).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <NetworkIcon network={a.platform} size={14} />
                    {a.username ? `@${a.username}` : a.displayName ?? a.platform}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connected {format(parseISO(a.createdAt), "MMM d, yyyy")}
                    {a.expiresAt &&
                      ` · token renews ${format(parseISO(a.expiresAt), "MMM d")}`}
                  </p>
                </div>
                <Badge variant="success">active</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Disconnect"
                  onClick={() => {
                    disconnect.mutate(a.id, {
                      onSuccess: () => toast.success("Account disconnected"),
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Connect new */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add an account</CardTitle>
          <CardDescription>
            You'll be sent to the platform to approve access, then brought back
            here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["instagram", "tiktok"] as ApiPlatform[]).map((platform) => {
            const availability = available.find((x) => x.platform === platform);
            const configured = availability?.configured ?? false;
            return (
              <div
                key={platform}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <NetworkIcon network={platform} chip size={18} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">{platform}</p>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_HELP[platform]}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={!configured || connecting !== null}
                  onClick={() => connect(platform)}
                >
                  {connecting === platform ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plug className="h-4 w-4" />
                  )}
                  Connect
                </Button>
                {!configured && !isLoading && (
                  <p className="flex w-full items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Server credentials missing for this platform — see SETUP.md.
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
