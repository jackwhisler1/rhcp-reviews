import { Request, Response, NextFunction } from "express";

// Async route handler wrapper function
const asyncRouteHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncRouteHandler;
