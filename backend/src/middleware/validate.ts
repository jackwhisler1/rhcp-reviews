import { Request, Response, NextFunction } from "express";
import { AnyZodObject, z } from "zod";
import { ValidationError } from "../errors/customErrors.js";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log("Incoming Request Body:", req.body);

    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation Error Details:", error.errors);
        next(
          new ValidationError("Validation failed", (error as z.ZodError).errors)
        );
      }
      next(error);
    }
  };
};
