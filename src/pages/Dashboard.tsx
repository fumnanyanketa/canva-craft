import { Eye, Heart, TrendingUp, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { ChartCard } from "@/components/ChartCard";
import { TopPostsTable } from "@/components/TopPostsTable";
import { NetworkIcon } from "@/components/NetworkIcon";
import { useMetrics, useTopPosts } from "@/hooks/useSocialData";
import { useAppStore } from "@/store/useAppStore";
import { NETWORKS } from "@/services/networks";
import { formatCompact, formatNumber, formatPercent } from "@/lib/utils";

const chartTooltipStyle = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
};

export function Dashboard() {
  const profileId = useAppStore((s) => s.profileId);
  const range = useAppStore((s) => s.range);

  const metrics = useMetrics(profileId, "all", range);
  const topPosts = useTopPosts(profileId, "all", range);

  const summary = metrics.data?.summary;
  const series =
    metrics.data?.series.map((p) => ({
      ...p,
      label: format(parseISO(p.date), "MMM d"),
    })) ?? [];
  const breakdown = metrics.data?.networkBreakdown ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview across all connected networks.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <KpiCard
          label="Posts"
          icon={TrendingUp}
          loading={metrics.isLoading}
          value={summary ? formatNumber(summary.posts.value) : "—"}
          changePct={summary?.posts.changePct}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Follower growth"
          description="Cumulative followers over the period"
          loading={metrics.isLoading}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v) => [formatNumber(v as number), "Followers"]}
              />
              <Area
                type="monotone"
                dataKey="followers"
                stroke="hsl(230 100% 62%)"
                strokeWidth={2}
                fill="url(#fg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="By network"
          description="Follower share"
          loading={metrics.isLoading}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={breakdown}
                dataKey="value"
                nameKey="network"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {breakdown.map((entry) => (
                  <Cell
                    key={entry.network}
                    fill={NETWORKS[entry.network].color}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v, n) => [
                  formatCompact(v as number),
                  NETWORKS[n as keyof typeof NETWORKS]?.label ?? n,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {breakdown.map((b) => (
              <span
                key={b.network}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <NetworkIcon network={b.network} size={12} />
                {NETWORKS[b.network].label}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Daily engagement"
          description="Likes, comments & shares per day"
          loading={metrics.isLoading}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
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
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={chartTooltipStyle}
                formatter={(v) => [formatNumber(v as number), "Engagement"]}
              />
              <Bar
                dataKey="engagement"
                fill="hsl(230 100% 62%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top posts"
          description="Best performing this period"
          loading={topPosts.isLoading}
        >
          <TopPostsTable posts={topPosts.data} loading={topPosts.isLoading} />
        </ChartCard>
      </div>
    </div>
  );
}
