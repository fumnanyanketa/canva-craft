import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@/services";
import type { DateRange, NetworkId, NewPostInput } from "@/services/types";

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: () => client.getProfiles(),
    staleTime: Infinity,
  });
}

export function useMetrics(
  profileId: string,
  scope: NetworkId | "all",
  range: DateRange
) {
  return useQuery({
    queryKey: ["metrics", profileId, scope, range.from, range.to],
    queryFn: () => client.getMetrics(profileId, scope, range),
  });
}

export function useTopPosts(
  profileId: string,
  scope: NetworkId | "all",
  range: DateRange
) {
  return useQuery({
    queryKey: ["topPosts", profileId, scope, range.from, range.to],
    queryFn: () => client.getTopPosts(profileId, scope, range),
  });
}

export function useBestTime(profileId: string, scope: NetworkId | "all") {
  return useQuery({
    queryKey: ["bestTime", profileId, scope],
    queryFn: () => client.getBestTime(profileId, scope),
  });
}

export function usePosts(profileId: string) {
  return useQuery({
    queryKey: ["posts", profileId],
    queryFn: () => client.getPosts(profileId),
  });
}

export function useCreatePost(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPostInput) => client.createPost(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", profileId] });
    },
  });
}

export function useDeletePost(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => client.deletePost(profileId, postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", profileId] });
    },
  });
}
