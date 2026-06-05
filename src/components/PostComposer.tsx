import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { NetworkIcon } from "@/components/NetworkIcon";
import { useCreatePost, useProfiles } from "@/hooks/useSocialData";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { NetworkId } from "@/services/types";

const MAX_CHARS = 280;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the date (yyyy-MM-dd) when opened from a calendar day. */
  defaultDate?: string;
}

export function PostComposer({ open, onOpenChange, defaultDate }: Props) {
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

  const remaining = MAX_CHARS - caption.length;
  const canSubmit =
    caption.trim().length > 0 && selected.length > 0 && date && remaining >= 0;

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
    toast.success("Post scheduled", {
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
            <span className="font-medium text-foreground">
              {profile?.name}
            </span>
            . This is saved locally in your browser.
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
