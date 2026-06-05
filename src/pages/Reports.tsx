import { format, parseISO } from "date-fns";
import { Printer } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TopPostsTable } from "@/components/TopPostsTable";
import { NetworkIcon } from "@/components/NetworkIcon";
import { useMetrics, useProfiles, useTopPosts } from "@/hooks/useSocialData";
import { useAppStore } from "@/store/useAppStore";
import { NETWORKS } from "@/services/networks";
import {
  formatCompact,
  formatDelta,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

export function Reports() {
  const profileId = useAppStore((s) => s.profileId);
  const range = useAppStore((s) => s.range);
  const { data: profiles } = useProfiles();
  const profile = profiles?.find((p) => p.id === profileId);

  const metrics = useMetrics(profileId, "all", range);
  const topPosts = useTopPosts(profileId, "all", range);

  const summary = metrics.data?.summary;
  const series =
    metrics.data?.series.map((p) => ({
      ...p,
      label: format(parseISO(p.date), "MMM d"),
    })) ?? [];
  const breakdown = metrics.data?.networkBreakdown ?? [];

  const kpis = summary
    ? [
        { label: "Followers", value: formatNumber(summary.followers.value), d: summary.followers.changePct },
        { label: "Reach", value: formatCompact(summary.reach.value), d: summary.reach.changePct },
        { label: "Engagement", value: formatPercent(summary.engagementRate.value), d: summary.engagementRate.changePct },
        { label: "Posts", value: formatNumber(summary.posts.value), d: summary.posts.changePct },
      ]
    : [];

  return (
    <div className="print-area space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance report</h1>
          <p className="text-muted-foreground">
            {profile?.name} · {format(parseISO(range.from), "MMM d")} –{" "}
            {format(parseISO(range.to), "MMM d, yyyy")}
          </p>
        </div>
        <Button className="no-print" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Export PDF
        </Button>
      </div>

      {/* Report header (visible in print) */}
      <Card className="print-break-inside-avoid">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Brand</p>
            <p className="text-xl font-bold">{profile?.name}</p>
            <p className="text-sm text-muted-foreground">{profile?.handle}</p>
          </div>
          <div className="flex gap-2">
            {profile?.networks.map((n) => (
              <NetworkIcon key={n} network={n} chip size={16} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="print-break-inside-avoid">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-bold">{k.value}</p>
              <p
                className={
                  k.d >= 0
                    ? "text-sm font-medium text-emerald-600"
                    : "text-sm font-medium text-rose-600"
                }
              >
                {formatDelta(k.d)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="print-break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-base">Follower growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(230 100% 62%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(230 100% 62%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                minTickGap={28}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={48}
                tickFormatter={(v) => formatCompact(v as number)}
              />
              <Area
                type="monotone"
                dataKey="followers"
                stroke="hsl(230 100% 62%)"
                strokeWidth={2}
                fill="url(#rep)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="print-break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-base">Audience by network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdown.map((b) => {
              const total = breakdown.reduce((a, c) => a + c.value, 0) || 1;
              const pct = (b.value / total) * 100;
              return (
                <div key={b.network}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <NetworkIcon network={b.network} size={14} />
                      {NETWORKS[b.network].label}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCompact(b.value)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: NETWORKS[b.network].color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="print-break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-base">Top posts</CardTitle>
          </CardHeader>
          <CardContent>
            <TopPostsTable posts={topPosts.data} loading={topPosts.isLoading} />
          </CardContent>
        </Card>
      </div>

      <p className="pt-4 text-center text-xs text-muted-foreground">
        Generated by Metricool Lite · {format(new Date(), "PPP")} · Demo data
      </p>
    </div>
  );
}
