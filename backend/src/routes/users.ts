import express from "express";
import {
  registerUserController,
  loginUserController,
  getCurrentUserController,
  updateUserController,
  deleteUserController,
  refreshTokenController,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  registrationSchema,
  loginSchema,
  updateUserSchema,
  refreshTokenSchema,
} from "../validators/user.validator.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validate(registrationSchema), registerUserController);
router.post("/login", validate(loginSchema), loginUserController);
router.post("/refresh", validate(refreshTokenSchema), refreshTokenController);
router.get("/me", authenticate, getCurrentUserController);
router.patch(
  "/me",
  authenticate,
  validate(updateUserSchema._def.schema),
  updateUserController
);

router.delete("/me", authenticate, deleteUserController);

export default router;
