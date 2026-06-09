import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NetworkIcon } from "@/components/NetworkIcon";
import { PostComposer } from "@/components/PostComposer";
import { usePosts, useDeletePost } from "@/hooks/useSocialData";
import { useRealPosts, useDeleteRealPost } from "@/hooks/useRealData";
import { useAppStore } from "@/store/useAppStore";
import { useIsReal } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import type { Post } from "@/services/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Calendar() {
  const isReal = useIsReal();
  const profileId = useAppStore((s) => s.profileId);

  // Demo posts (generated + localStorage) or real posts from the backend —
  // both arrive in the same UI shape, so the grid below doesn't care.
  const demoQuery = usePosts(profileId, !isReal);
  const realQuery = useRealPosts(isReal);
  const posts = isReal ? realQuery.data : demoQuery.data;
  const isLoading = isReal ? realQuery.isLoading : demoQuery.isLoading;

  const deleteDemoPost = useDeletePost(profileId);
  const deleteRealPost = useDeleteRealPost();

  const canDelete = (p: Post) =>
    isReal
      ? p.status === "scheduled" || p.status === "draft" || p.status === "failed"
      : p.id.startsWith("user-");
  const removePost = (p: Post) =>
    isReal ? deleteRealPost.mutate(p.id) : deleteDemoPost.mutate(p.id);

  const [month, setMonth] = useState(() => new Date());
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDate, setComposerDate] = useState<string | undefined>();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts ?? []) {
      const key = format(parseISO(p.scheduledAt), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  const openComposer = (day?: Date) => {
    setComposerDate(day ? format(day, "yyyy-MM-dd") : undefined);
    setComposerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">
            Schedule and preview your content calendar.
          </p>
        </div>
        <Button onClick={() => openComposer()}>
          <Plus className="h-4 w-4" /> New post
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {format(month, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px border-b pb-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-border">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            return (
              <div
                key={key}
                className={cn(
                  "group relative min-h-[110px] bg-card p-1.5",
                  !inMonth && "bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(day) &&
                        "bg-primary font-semibold text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <button
                    onClick={() => openComposer(day)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Add post"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <CalendarChip
                      key={p.id}
                      post={p}
                      onDelete={canDelete(p) ? () => removePost(p) : undefined}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="block px-1 text-[10px] text-muted-foreground">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isLoading && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Loading calendar…
          </p>
        )}
      </Card>

      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        defaultDate={composerDate}
      />
    </div>
  );
}

function CalendarChip({
  post,
  onDelete,
}: {
  post: Post;
  onDelete?: () => void;
}) {
  const { status } = post;
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px]",
        status === "published" && "bg-muted",
        status === "failed" &&
          "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        status === "publishing" &&
          "animate-pulse bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        (status === "scheduled" || status === "draft") &&
          "bg-accent text-accent-foreground"
      )}
      title={post.error ? `${post.caption}\n⚠ ${post.error}` : post.caption}
    >
      <span className="flex shrink-0 items-center gap-0.5">
        {post.networks.slice(0, 2).map((n) => (
          <NetworkIcon key={n} network={n} size={11} />
        ))}
      </span>
      <span className="truncate">{post.caption}</span>
      {status === "published" && (
        <Badge variant="success" className="ml-auto shrink-0 px-1 py-0 text-[9px]">
          live
        </Badge>
      )}
      {status === "publishing" && (
        <span className="ml-auto shrink-0 text-[9px] font-medium">posting…</span>
      )}
      {status === "failed" && !onDelete && (
        <span className="ml-auto shrink-0 text-[9px] font-medium">failed</span>
      )}
      {(status === "scheduled" || status === "draft" || status === "failed") &&
        onDelete && (
          <button
            onClick={onDelete}
            className="ml-auto shrink-0 opacity-60 hover:opacity-100"
            aria-label="Delete post"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
    </div>
  );
}
