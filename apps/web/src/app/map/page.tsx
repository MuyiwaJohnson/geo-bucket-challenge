"use client";

import { Header } from "@/components/layout/header";
import { PropertyMap } from "@/components/map/property-map";
import { useProperties } from "@/lib/hooks/use-properties";
import { Loader2 } from "lucide-react";

export default function MapPage() {
  const { data: properties, isLoading, error } = useProperties();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="text-center">
            <p className="text-destructive">Error loading properties</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PropertyMap
          properties={properties || []}
          height="calc(100vh - 4rem)"
        />
      </main>
    </div>
  );
}

