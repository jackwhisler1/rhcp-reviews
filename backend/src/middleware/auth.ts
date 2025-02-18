import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { AuthenticationError } from "../errors/customErrors.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).id },
    });

    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (err) {
    next(new AuthenticationError());
  }
};
