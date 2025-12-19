"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export function useBucketStats() {
  return useQuery({
    queryKey: ["buckets", "stats"],
    queryFn: () => api.buckets.stats(),
  });
}
