"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { SearchBar } from "@/components/search/search-bar";
import { PropertyCard } from "@/components/properties/property-card";
import { useSearch } from "@/lib/hooks/use-search";
import { Loader2, Search } from "lucide-react";

const PropertyMap = dynamic(
  () => import("@/components/map/property-map").then((mod) => ({ default: mod.PropertyMap })),
  {
    loading: () => (
      <div className="h-full min-h-[500px] bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

function SearchContent() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get("location") || "";
  const [searchQuery, setSearchQuery] = useState(locationParam);
  const { data: properties, isLoading, error } = useSearch(searchQuery);

  useEffect(() => {
    setSearchQuery(locationParam);
  }, [locationParam]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    window.history.pushState({}, "", `/search?location=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <section className="border-b">
        <div className="container py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold mb-4">Search Properties</h1>
          <SearchBar
            defaultValue={searchQuery}
            onSearch={handleSearch}
            debounceMs={500}
            showLoading={isLoading}
          />
        </div>
      </section>

      <main className="flex-1 container py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        {isLoading && searchQuery && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive">Error searching properties</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && searchQuery && (
          <div className="grid gap-6 lg:grid-cols-2 h-[calc(100vh-220px)]">
            {/* Left side - scrollable results */}
            <div className="flex flex-col min-h-0">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 shrink-0">
                Results ({properties?.length ?? 0})
              </h2>
              
              {properties && properties.length > 0 ? (
                <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                  {properties.map((property, index) => (
                    <div key={property.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                      <PropertyCard property={property} index={index} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-muted-foreground">No properties found for &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>

            {/* Right side - sticky map */}
            <div className="flex flex-col min-h-0">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 shrink-0">
                Map
              </h2>
              
              {properties && properties.length > 0 ? (
                <div className="rounded-lg overflow-hidden border flex-1 min-h-[400px]">
                  <Suspense fallback={
                    <div className="h-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  }>
                    <PropertyMap properties={properties} height="100%" />
                  </Suspense>
                </div>
              ) : (
                <div className="flex-1 min-h-[400px] bg-muted rounded-lg flex items-center justify-center border">
                  <p className="text-muted-foreground">No map data</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-16">
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Enter a location to search for properties</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
