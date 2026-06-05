import { Heart, MessageCircle, Share2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { NetworkIcon } from "@/components/NetworkIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, formatPercent } from "@/lib/utils";
import type { TopPost } from "@/services/types";

interface Props {
  posts?: TopPost[];
  loading?: boolean;
}

export function TopPostsTable({ posts, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No posts in this period.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center gap-3 py-3">
          <NetworkIcon network={post.network} chip size={16} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{post.caption}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(post.date), "MMM d, yyyy")}
            </p>
          </div>
          <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {formatCompact(post.likes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />{" "}
              {formatCompact(post.comments)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" /> {formatCompact(post.shares)}
            </span>
          </div>
          <div className="w-16 text-right text-sm font-semibold text-primary">
            {formatPercent(post.engagementRate)}
          </div>
        </div>
      ))}
    </div>
  );
}
