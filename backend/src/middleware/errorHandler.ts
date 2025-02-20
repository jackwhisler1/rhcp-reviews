import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if response is still writable
  if (res.headersSent || typeof res.status !== "function") {
    return next(err);
  }

  // Handle static file errors first
  if (req.path.startsWith("/images")) {
    return res.status(404).send("Image not found");
  }

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res?.status(400).json({
      error: "Validation Error",
      details: err.errors,
    });
  }

  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    return res?.status(400).json({
      error: "Database Error",
      code: err.code,
    });
  }

  // Handle other errors
  res?.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
};
