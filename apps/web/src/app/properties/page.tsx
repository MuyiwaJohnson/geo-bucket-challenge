"use client";

import { Header } from "@/components/layout/header";
import { PropertyCard } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/lib/hooks/use-properties";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PropertiesPage() {
  const { data: properties, isLoading, error } = useProperties();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
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
        <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-destructive text-lg font-semibold mb-2">
              Error loading properties
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message ||
                "Failed to connect to the API. Make sure the API server is running."}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Properties</h1>
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Link>
          </Button>
        </div>

        {properties && properties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No properties found</p>
            <Button asChild>
              <Link href="/properties/new">Create First Property</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
