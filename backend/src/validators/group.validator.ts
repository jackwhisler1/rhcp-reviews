import { z } from "zod";

export const groupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name too long (max 100 characters)"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

export type GroupInput = z.infer<typeof groupSchema>;
