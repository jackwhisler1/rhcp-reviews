import { z } from "zod";

export const reviewSchema = z.object({
  songId: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(10).max(500),
});
