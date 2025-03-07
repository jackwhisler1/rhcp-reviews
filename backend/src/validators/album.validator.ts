import { z } from "zod";

const baseAlbumSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title too long (max 100 characters)"),
  releaseDate: z.coerce
    .date({
      required_error: "Release date is required",
      invalid_type_error: "Invalid date format",
    })
    .max(new Date(), "Release date cannot be in the future")
    .refine((date) => date.getFullYear() >= 1900, "Invalid release year"),
  artworkUrl: z
    .string()
    .url("Invalid artwork URL")
    .regex(/\.(jpeg|jpg|png|webp)$/i, "Invalid image format"),
});

export const createAlbumSchema = z.object({
  body: baseAlbumSchema,
});
// For update operations - all fields optional
export const updateAlbumSchema = baseAlbumSchema.partial();

export type AlbumInput = z.infer<typeof baseAlbumSchema>;
