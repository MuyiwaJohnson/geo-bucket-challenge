"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { CreatePropertyRequest } from "@geoflow/types";

const PropertyMap = dynamic(
  () => import("@/components/map/property-map").then((mod) => ({ default: mod.PropertyMap })),
  {
    loading: () => (
      <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  location_name: z.string().min(1, "Location name is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  price: z.number().min(0).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
});

interface PropertyFormProps {
  defaultValues?: Partial<CreatePropertyRequest>;
  onSubmit: (data: CreatePropertyRequest) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

function MapPreview({ control }: { control: any }) {
  const lat = useWatch({ control, name: "lat" }) ?? 6.4698;
  const lng = useWatch({ control, name: "lng" }) ?? 3.6285;
  const title = useWatch({ control, name: "title" }) ?? "New Property";
  const locationName = useWatch({ control, name: "location_name" }) ?? "Location";

  const previewProperty = {
    id: 0,
    title: title || "New Property",
    location_name: locationName || "Location",
    lat: typeof lat === "number" && !isNaN(lat) ? lat : 6.4698,
    lng: typeof lng === "number" && !isNaN(lng) ? lng : 3.6285,
    price: null,
    bedrooms: null,
    bathrooms: null,
    bucket_id: null,
    created_at: null,
  };

  return (
    <div className="rounded-lg overflow-hidden border">
      <PropertyMap
        properties={[previewProperty]}
        center={[previewProperty.lat, previewProperty.lng]}
        zoom={15}
        height="200px"
      />
    </div>
  );
}

export function PropertyForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreatePropertyRequest>({
    resolver: zodResolver(propertySchema),
    defaultValues: defaultValues || {
      title: "",
      location_name: "",
      lat: 6.4698,
      lng: 3.6285,
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="3BR Flat in Sangotedo"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="location_name">Location Name</Label>
        <Input
          id="location_name"
          {...register("location_name")}
          placeholder="Sangotedo"
        />
        {errors.location_name && (
          <p className="text-sm text-destructive mt-1">
            {errors.location_name.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            {...register("lat", { valueAsNumber: true })}
            placeholder="6.4698"
          />
          {errors.lat && (
            <p className="text-sm text-destructive mt-1">{errors.lat.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            {...register("lng", { valueAsNumber: true })}
            placeholder="3.6285"
          />
          {errors.lng && (
            <p className="text-sm text-destructive mt-1">{errors.lng.message}</p>
          )}
        </div>
      </div>

      {/* Map Preview */}
      <div>
        <Label className="mb-2 block">Location Preview</Label>
        <MapPreview control={control} />
        <p className="text-xs text-muted-foreground mt-1">
          Adjust latitude and longitude to position the marker
        </p>
      </div>

      <div>
        <Label htmlFor="price">Price (NGN)</Label>
        <Input
          id="price"
          type="number"
          step="any"
          {...register("price", { valueAsNumber: true })}
          placeholder="5000000"
        />
        {errors.price && (
          <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            {...register("bedrooms", { valueAsNumber: true })}
            placeholder="3"
          />
          {errors.bedrooms && (
            <p className="text-sm text-destructive mt-1">
              {errors.bedrooms.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            {...register("bathrooms", { valueAsNumber: true })}
            placeholder="2"
          />
          {errors.bathrooms && (
            <p className="text-sm text-destructive mt-1">
              {errors.bathrooms.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Property"}
        </Button>
      </div>
    </form>
  );
}
