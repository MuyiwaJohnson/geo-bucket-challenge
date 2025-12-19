"use client";

import { use } from "react";
import { Header } from "@/components/layout/header";
import { PropertyForm } from "@/components/properties/property-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProperty, useUpdateProperty } from "@/lib/hooks/use-properties";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { CreatePropertyRequest } from "@geoflow/types";

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const propertyId = parseInt(id);
  const { data: property, isLoading } = useProperty(propertyId);
  const updateProperty = useUpdateProperty();

  const handleSubmit = async (data: CreatePropertyRequest) => {
    try {
      await updateProperty.mutateAsync({
        id: propertyId,
        data,
      });
      router.push(`/properties/${propertyId}`);
    } catch {
      // Error is handled by React Query
    }
  };

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

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-destructive">Property not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Property</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyForm
              defaultValues={{
                title: property.title,
                location_name: property.location_name,
                lat: property.lat,
                lng: property.lng,
                price: property.price ?? undefined,
                bedrooms: property.bedrooms ?? undefined,
                bathrooms: property.bathrooms ?? undefined,
              }}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/properties/${propertyId}`)}
              isLoading={updateProperty.isPending}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

