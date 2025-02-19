import { Request, Response } from "express";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  deleteUserService,
} from "../services/user.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import { UpdateUserInput } from "../validators/user.validator.js";
import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";

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
    const { token, user } = await loginUserService(
      req.body.email,
      req.body.password
    );
    res.json({ token, user });
  }
);

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getCurrentUserService(req.user!.id);
    res.json(user);
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
