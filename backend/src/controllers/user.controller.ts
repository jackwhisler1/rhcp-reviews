import { Request, Response } from "express";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  deleteUserService,
  refreshTokenService,
  updateUserService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/user.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import { UpdateUserInput } from "../validators/user.validator.js";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/customErrors.js";

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Call the service to register the user
      const user = await registerUserService(req.body);

      // Generate tokens for the newly registered user
      const { token, refreshToken } = await loginUserService(
        req.body.email,
        req.body.password
      );

      // Return user info and tokens
      res.status(201).json({
        user,
        token,
        refreshToken,
      });
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

    // Return tokens and user data for frontend storage
    res.json({
      token,
      refreshToken,
      user,
    });
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
      // Get new tokens from the service
      const tokens = await refreshTokenService(refreshToken);

      // Map the service response to what the frontend expects
      res.json({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
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

    const user = await updateUserService(req.user!.id, updateData);

    res.json(user);
  }
);

export const deleteUserController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteUserService(req.user!.id);
    res.sendStatus(204);
  }
);

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await forgotPasswordService(req.body.email);
      res.status(200).json({ message: "Email sent" });
    } catch (e) {
      console.error(e);
    }
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      await resetPasswordService(token, newPassword);
      res.status(200).json({ message: "Password reset" });
    } catch (e) {
      console.error(e);
    }
  }
);
