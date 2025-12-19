"use client";

import { Header } from "@/components/layout/header";
import { PropertyForm } from "@/components/properties/property-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProperty } from "@/lib/hooks/use-properties";
import { useRouter } from "next/navigation";
import type { CreatePropertyRequest } from "@geoflow/types";

export default function NewPropertyPage() {
  const router = useRouter();
  const createProperty = useCreateProperty();

  const handleSubmit = async (data: CreatePropertyRequest) => {
    try {
      const property = await createProperty.mutateAsync(data);
      router.push(`/properties/${property.id}`);
    } catch {
      // Error is handled by React Query
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Property</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyForm
              onSubmit={handleSubmit}
              onCancel={() => router.push("/properties")}
              isLoading={createProperty.isPending}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
