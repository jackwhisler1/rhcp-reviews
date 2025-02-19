import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+]{8,}$/;

// Registration Schema
export const registrationSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3).max(20),
  password: z.string().min(8),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// Update User Schema
export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    username: z
      .string()
      .min(3, "Username too short")
      .max(20, "Username too long")
      .optional(),
    password: z.string().min(8).optional(),
    image: z.string().url("Invalid image URL").optional(),
  })
  .refine((data) => {
    // Ensure at least one field is provided
    return Object.keys(data).length > 0;
  }, "At least one field must be provided");

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
