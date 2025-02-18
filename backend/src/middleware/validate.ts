import { Request, Response, NextFunction } from "express";
import { AnyZodObject, z } from "zod";
import { ValidationError } from "../errors/customErrors";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          new ValidationError("Validation failed", (error as z.ZodError).errors)
        );
      }
      next(error);
    }
  };
};
