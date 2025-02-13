import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack); // Log the error stack trace

  const statusCode = err.statusCode || 500; // Use custom status code if available, otherwise 500
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
  });
};
