import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../errors/customErrors.js";

const saltRounds = 10;

export const registerUserService = async (data: {
  email: string;
  username: string;
  password: string;
}) => {
  if (data.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters", {
      password: "Length validation failed",
    });
  }

  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  try {
    return await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const field = (error.meta?.target as string[])?.[0];
        throw new ValidationError(`${field} already exists`, {
          [field]: "Must be unique",
        });
      }
    }
    throw error;
  }
};

export const loginUserService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      email: true,
      username: true,
      image: true,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthenticationError("Invalid credentials");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });
  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      image: user.image,
    },
  };
};

export const getCurrentUserService = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
      groups: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const updateUserService = async (
  userId: number,
  data: Partial<{
    username: string;
    email: string;
    password: string;
    image: string;
  }>
) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, saltRounds);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
    },
  });
};

export const refreshTokenService = async (refreshToken: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable missing");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, refreshToken: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Generate new tokens with fresh expiration
    const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Refresh token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Invalid refresh token");
    }
    throw new AuthenticationError("Token refresh failed");
  }
};
export const deleteUserService = async (userId: number) => {
  return prisma.user.delete({
    where: { id: userId },
  });
};
