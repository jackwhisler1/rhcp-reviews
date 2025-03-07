import { Request, Response } from "express";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  deleteUserService,
  refreshTokenService,
} from "../services/user.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import { UpdateUserInput } from "../validators/user.validator.js";
import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";

const saltRounds = 10;

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      console.log("Received registration data:", req.body);
      const user = await registerUserService(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Validation Error:", error);
      const typedError = error as any;
      res.status(422).json({ error: typedError.errors ?? "Invalid request" });
    }
  }
);

export const loginUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, refreshToken, user } = await loginUserService(
      req.body.email,
      req.body.password
    );
    res.json({ token, refreshToken, user });
  }
);

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getCurrentUserService(req.user!.id);
    res.json(user);
  }
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError("Refresh token required", {
        refreshToken: "Missing refresh token",
      });
    }

    try {
      const tokens = await refreshTokenService(refreshToken);
      res.json(tokens);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

export const updateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const updateData: UpdateUserInput = req.body;

    // If password is being updated, hash it first
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
      },
    });

    res.json(user);
  }
);

export const deleteUserController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteUserService(req.user!.id);
    res.sendStatus(204);
  }
);
