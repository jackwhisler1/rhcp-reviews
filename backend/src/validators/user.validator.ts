import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// Registration Schema
export const registrationSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username too long (max 20 characters)"),
  password: z
    .string()
    .regex(
      passwordRegex,
      "Password must contain uppercase, lowercase and number"
    ),
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
    password: z
      .string()
      .regex(passwordRegex, "Invalid password format")
      .optional(),
    image: z.string().url("Invalid image URL").optional(),
  })
  .refine((data) => {
    // Ensure at least one field is provided
    return Object.keys(data).length > 0;
  }, "At least one field must be provided");

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
