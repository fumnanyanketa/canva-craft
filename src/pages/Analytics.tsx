import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/ChartCard";
import { KpiCard } from "@/components/KpiCard";
import { BestTimeHeatmap } from "@/components/BestTimeHeatmap";
import { TopPostsTable } from "@/components/TopPostsTable";
import { NetworkIcon } from "@/components/NetworkIcon";
import {
  useBestTime,
  useMetrics,
  useProfiles,
  useTopPosts,
} from "@/hooks/useSocialData";
import { useAppStore } from "@/store/useAppStore";
import { NETWORKS } from "@/services/networks";
import { formatCompact, formatNumber, formatPercent } from "@/lib/utils";
import { Eye, Heart, Users } from "lucide-react";
import type { NetworkId } from "@/services/types";

const chartTooltipStyle = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
};

export function Analytics() {
  const profileId = useAppStore((s) => s.profileId);
  const range = useAppStore((s) => s.range);
  const { data: profiles } = useProfiles();
  const profile = profiles?.find((p) => p.id === profileId);
  const networks = profile?.networks ?? [];

  const [scope, setScope] = useState<NetworkId>(networks[0] ?? "instagram");
  const active: NetworkId = networks.includes(scope)
    ? scope
    : networks[0] ?? "instagram";

  const metrics = useMetrics(profileId, active, range);
  const topPosts = useTopPosts(profileId, active, range);
  const bestTime = useBestTime(profileId, active);

  const summary = metrics.data?.summary;
  const series =
    metrics.data?.series.map((p) => ({
      ...p,
      label: format(parseISO(p.date), "MMM d"),
    })) ?? [];

  const color = NETWORKS[active].color;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Per-network deep dive for {profile?.name}.
        </p>
      </div>

      <Tabs value={active} onValueChange={(v) => setScope(v as NetworkId)}>
        <TabsList className="flex h-auto flex-wrap">
          {networks.map((n) => (
            <TabsTrigger key={n} value={n} className="gap-2 capitalize">
              <NetworkIcon network={n} size={14} />
              {NETWORKS[n].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Followers"
          icon={Users}
          loading={metrics.isLoading}
          value={summary ? formatNumber(summary.followers.value) : "—"}
          changePct={summary?.followers.changePct}
        />
        <KpiCard
          label="Reach"
          icon={Eye}
          loading={metrics.isLoading}
          value={summary ? formatCompact(summary.reach.value) : "—"}
          changePct={summary?.reach.changePct}
        />
        <KpiCard
          label="Engagement rate"
          icon={Heart}
          loading={metrics.isLoading}
          value={summary ? formatPercent(summary.engagementRate.value) : "—"}
          changePct={summary?.engagementRate.changePct}
        />
      </div>

      <ChartCard
        title="Reach & impressions"
        description={`${NETWORKS[active].label} performance over time`}
        loading={metrics.isLoading}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              minTickGap={28}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={48}
              tickFormatter={(v) => formatCompact(v as number)}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(v, n) => [
                formatNumber(v as number),
                n === "reach" ? "Reach" : "Impressions",
              ]}
            />
            <Line
              type="monotone"
              dataKey="reach"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="impressions"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Best time to post"
          description="Audience engagement by day & hour"
          loading={bestTime.isLoading}
        >
          <BestTimeHeatmap data={bestTime.data} loading={bestTime.isLoading} />
        </ChartCard>

        <ChartCard
          title="Top posts"
          description={`Best ${NETWORKS[active].label} content`}
          loading={topPosts.isLoading}
        >
          <TopPostsTable posts={topPosts.data} loading={topPosts.isLoading} />
        </ChartCard>
      </div>
    </div>
  );
}
