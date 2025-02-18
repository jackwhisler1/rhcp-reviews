import { z } from "zod";

export const songSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(100, "Title too long (max 100 characters)"),
  trackNumber: z.number().int().positive(),
  duration: z.string().regex(/^\d+:\d{2}$/, "Invalid duration format (MM:SS)"),
  albumId: z.number().int().positive(),
});

export type SongInput = z.infer<typeof songSchema>;
