import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err instanceof Error ? err.stack : String(err));

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: "Validation Error",
      details: err.errors,
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    res.status(400).json({
      error: "Database Error",
      code: err.code,
    });
    return;
  }

  // Handle custom errors
  if (err instanceof Error) {
    res.status(500).json({
      error: err.message,
    });
    return;
  }

  // Fallback for unknown errors
  res.status(500).json({
    error: "Internal Server Error",
  });
};
