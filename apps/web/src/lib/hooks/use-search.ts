"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export function useSearch(location: string) {
  return useQuery({
    queryKey: ["search", location],
    queryFn: () => api.search.byLocation(location),
    enabled: location.length > 0,
  });
}

