import { z } from "zod";

const coordinateSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

export const createPropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  location_name: z.string().min(1, 'Location name is required'),
  lat: coordinateSchema,
  lng: longitudeSchema,
  price: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
});

export const searchQuerySchema = z.object({
  location: z.string().min(1, "Location is required"),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

