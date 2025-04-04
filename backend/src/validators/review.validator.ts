import { z } from "zod";

export const reviewSchema = z.object({
  songId: z.number().int().positive(),
  rating: z.number().min(0.1).max(10),
  reviewText: z.string().max(500),
});
