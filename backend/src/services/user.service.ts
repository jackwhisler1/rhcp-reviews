import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../errors/customErrors";

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
  } catch (error) {
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

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return {
    token,
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

export const deleteUserService = async (userId: number) => {
  return prisma.user.delete({
    where: { id: userId },
  });
};
