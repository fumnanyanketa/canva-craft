import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plug, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkIcon } from "@/components/NetworkIcon";
import { useCreatePost, useProfiles } from "@/hooks/useSocialData";
import { useAccounts, useCreateRealPost } from "@/hooks/useRealData";
import { useAppStore } from "@/store/useAppStore";
import { useIsReal } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { NetworkId } from "@/services/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the date (yyyy-MM-dd) when opened from a calendar day. */
  defaultDate?: string;
}

export function PostComposer(props: Props) {
  const isReal = useIsReal();
  return isReal ? <RealComposer {...props} /> : <DemoComposer {...props} />;
}

/* ------------------------------------------------------------------ */
/* Real mode: schedule to actual connected accounts via the backend.   */
/* ------------------------------------------------------------------ */

const REAL_MAX_CHARS = 2200; // matches the server's caption limit

function RealComposer({ open, onOpenChange, defaultDate }: Props) {
  const navigate = useNavigate();
  const { data, isLoading } = useAccounts(open);
  const createPost = useCreateRealPost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  useEffect(() => {
    if (open) {
      setCaption("");
      setSelected([]);
      setFile(null);
      setDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
      setTime("09:00");
    }
  }, [open, defaultDate]);

  const accounts = data?.accounts ?? [];
  const selectedAccounts = accounts.filter((a) => selected.includes(a.id));
  const igSelected = selectedAccounts.some((a) => a.platform === "instagram");
  const ttSelected = selectedAccounts.some((a) => a.platform === "tiktok");

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Platform media rules, enforced before the server even sees the post.
  const issues: string[] = [];
  if (igSelected && !file) issues.push("Instagram requires an image or video.");
  if (ttSelected && !(file && file.type.startsWith("video/")))
    issues.push("TikTok requires a video.");

  const remaining = REAL_MAX_CHARS - caption.length;
  const canSubmit =
    caption.trim().length > 0 &&
    selected.length > 0 &&
    issues.length === 0 &&
    remaining >= 0 &&
    !!date;

  const onSubmit = async () => {
    if (!canSubmit) return;
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    try {
      await createPost.mutateAsync({
        caption: caption.trim(),
        scheduledAt,
        accountIds: selected,
        file,
      });
      toast.success("Post scheduled", {
        description: `It will publish automatically on ${format(
          new Date(scheduledAt),
          "EEE, MMM d 'at' h:mm a"
        )}.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not schedule the post"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule a post</DialogTitle>
          <DialogDescription>
            This will be published automatically at the scheduled time.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <Plug className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Connect an Instagram or TikTok account first — then you can
              schedule real posts to it.
            </p>
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/settings/accounts");
              }}
            >
              Connect an account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Publish to</Label>
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => {
                  const on = selected.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggle(a.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        on
                          ? "border-primary bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <NetworkIcon network={a.platform} size={16} />
                      <span>
                        {a.username ? `@${a.username}` : a.platform}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="caption">Caption</Label>
                <span
                  className={cn(
                    "text-xs",
                    remaining < 0 ? "text-rose-600" : "text-muted-foreground"
                  )}
                >
                  {remaining}
                </span>
              </div>
              <Textarea
                id="caption"
                placeholder="What do you want to share?"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Media</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="media"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="flex-1"
                />
                {file && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove file"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
              {selected.length > 0 &&
                issues.map((msg) => (
                  <p
                    key={msg}
                    className="text-xs text-amber-600 dark:text-amber-400"
                  >
                    {msg}
                  </p>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {accounts.length > 0 && !isLoading && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!canSubmit || createPost.isPending}
            >
              {createPost.isPending ? "Scheduling…" : "Schedule post"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Demo mode: the original local-only composer (nothing leaves the     */
/* browser; posts persist to localStorage).                            */
/* ------------------------------------------------------------------ */

const DEMO_MAX_CHARS = 280;

function DemoComposer({ open, onOpenChange, defaultDate }: Props) {
  const profileId = useAppStore((s) => s.profileId);
  const { data: profiles } = useProfiles();
  const profile = profiles?.find((p) => p.id === profileId);
  const createPost = useCreatePost(profileId);

  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<NetworkId[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  // Reset the form whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setCaption("");
      setSelected(profile?.networks.slice(0, 1) ?? []);
      setDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
      setTime("09:00");
    }
  }, [open, defaultDate, profile?.networks]);

  const toggle = (n: NetworkId) =>
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );

  const remaining = DEMO_MAX_CHARS - caption.length;
  const canSubmit =
    caption.trim().length > 0 && selected.length > 0 && !!date && remaining >= 0;

  const onSubmit = async () => {
    if (!canSubmit) return;
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    await createPost.mutateAsync({
      profileId,
      networks: selected,
      caption: caption.trim(),
      scheduledAt,
      media: { kind: "image", tone: "#3b5bff" },
      status: "scheduled",
    });
    toast.success("Post scheduled (demo)", {
      description: `${format(new Date(scheduledAt), "EEE, MMM d 'at' h:mm a")} · ${selected.length} network${selected.length > 1 ? "s" : ""}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule a post</DialogTitle>
          <DialogDescription>
            Composing for{" "}
            <span className="font-medium text-foreground">{profile?.name}</span>
            . Demo mode: this is saved locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Networks</Label>
            <div className="flex flex-wrap gap-2">
              {profile?.networks.map((n) => {
                const on = selected.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggle(n)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      on
                        ? "border-primary bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <NetworkIcon network={n} size={16} />
                    <span className="capitalize">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="caption">Caption</Label>
              <span
                className={cn(
                  "text-xs",
                  remaining < 0 ? "text-rose-600" : "text-muted-foreground"
                )}
              >
                {remaining}
              </span>
            </div>
            <Textarea
              id="caption"
              placeholder="What do you want to share?"
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit || createPost.isPending}>
            {createPost.isPending ? "Scheduling…" : "Schedule post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
