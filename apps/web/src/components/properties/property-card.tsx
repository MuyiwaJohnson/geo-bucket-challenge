"use client";

import Link from "next/link";
import { MapPin, Bed, Bath } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { PropertyResponse } from "@geoflow/types";

interface PropertyCardProps {
  property: PropertyResponse;
  index?: number;
}

export function PropertyCard({ property, index }: PropertyCardProps) {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {index !== undefined && (
            <span className="shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">
              {property.title}
            </CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span className="truncate">{property.location_name}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="text-xl font-semibold">
            {formatPrice(property.price)}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms ?? 0} beds</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms ?? 0} baths</span>
            </div>
            {property.bucket_id && (
              <span className="text-xs">Bucket #{property.bucket_id}</span>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/properties/${property.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
