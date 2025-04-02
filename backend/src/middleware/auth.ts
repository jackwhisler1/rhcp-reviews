import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { AuthenticationError } from "../errors/customErrors.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        username?: string;
        image?: string | null;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return next(new AuthenticationError("Authentication required"));

  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new AuthenticationError("Authentication required"));
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    console.log(
      "Auth middleware processing token:",
      token.substring(0, 15) + "..."
    );

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload & { id: number };

    // Log the decoded user ID
    console.log("Decoded user ID:", decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Token expired"));
    }

    next(new AuthenticationError("Invalid authentication token"));
  }
};
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new AuthenticationError("Authentication required"));
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    console.log(
      "Auth middleware processing token:",
      token.substring(0, 15) + "..."
    );

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload & { id: number };

    // Log the decoded user ID
    console.log("Decoded user ID:", decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Token expired"));
    }

    next(new AuthenticationError("Invalid authentication token"));
  }
};
