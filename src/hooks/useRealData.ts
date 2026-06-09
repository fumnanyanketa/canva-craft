import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, type ApiPost, type ApiPlatform } from "@/lib/api";
import type { NetworkId, Post } from "@/services/types";

/**
 * Real-mode data hooks — the backend-API counterparts of useSocialData.
 * Server posts are mapped into the same UI `Post` shape the calendar already
 * renders, so demo and real mode share every component.
 */

export function useAccounts(enabled = true) {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.getAccounts(),
    enabled,
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.disconnectAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function mapApiPost(p: ApiPost): Post {
  const networks = [
    ...new Set(p.targets.map((t) => t.account.platform)),
  ] as NetworkId[];
  const firstError = p.targets.find((t) => t.error)?.error ?? undefined;
  return {
    id: p.id,
    profileId: "real",
    networks,
    caption: p.caption,
    media: p.media ? { kind: p.media.kind, tone: "#3b5bff" } : undefined,
    scheduledAt: p.scheduledAt,
    status: p.status,
    error: firstError,
  };
}

export function useRealPosts(enabled = true) {
  return useQuery({
    queryKey: ["posts", "real"],
    queryFn: async () => (await api.listPosts()).posts.map(mapApiPost),
    enabled,
  });
}

export interface CreateRealPostInput {
  caption: string;
  scheduledAt: string;
  accountIds: string[];
  file: File | null;
}

export function useCreateRealPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRealPostInput) => {
      let mediaId: string | undefined;
      if (input.file) {
        const { media } = await api.uploadMedia(input.file);
        mediaId = media.id;
      }
      return api.createPost({
        caption: input.caption,
        scheduledAt: input.scheduledAt,
        accountIds: input.accountIds,
        mediaId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", "real"] });
    },
  });
}

export function useDeleteRealPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", "real"] });
    },
  });
}

/** Begin an OAuth connect flow: ask the server for the URL, then redirect. */
export async function startConnect(platform: ApiPlatform): Promise<void> {
  const { url } = await api.oauthStart(platform);
  window.location.assign(url);
}
