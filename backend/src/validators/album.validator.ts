import { z } from "zod";

const baseAlbumSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title too long (max 100 characters)"),
  releaseDate: z.coerce
    .date()
    .max(new Date(), "Release date cannot be in the future")
    .refine((date) => date.getFullYear() >= 1900, "Invalid release year"),
  artworkUrl: z
    .string()
    .url("Invalid artwork URL")
    .regex(/\.(jpeg|jpg|png|webp|url)$/i, "Invalid image format"),
  artist: z.string().optional(),
});

export const createAlbumSchema = baseAlbumSchema;

// For update operations - all fields optional
export const updateAlbumSchema = baseAlbumSchema.partial();

export type AlbumInput = z.infer<typeof baseAlbumSchema>;
