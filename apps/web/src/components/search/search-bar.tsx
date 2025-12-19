"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  debounceMs?: number;
  showLoading?: boolean;
}

export function SearchBar({
  defaultValue = "",
  onSearch,
  debounceMs = 500,
  showLoading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsTyping(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setIsTyping(false);
      if (value.trim() && onSearch) {
        onSearch(value.trim());
      }
    }, debounceMs);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setIsTyping(false);
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/search?location=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-lg mx-auto gap-2">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by location..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {(isTyping || showLoading) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      <Button type="submit" disabled={isTyping || showLoading}>
        Search
      </Button>
    </form>
  );
}
