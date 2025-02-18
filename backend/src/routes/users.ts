import express from "express";
import {
  registerUserController,
  loginUserController,
  getCurrentUserController,
  updateUserController,
  deleteUserController,
} from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import {
  registrationSchema,
  loginSchema,
  updateUserSchema,
} from "../validators/user.validator";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.post("/register", validate(registrationSchema), registerUserController);
router.post("/login", validate(loginSchema), loginUserController);
router.get("/me", authenticate, getCurrentUserController);
router.patch(
  "/me",
  authenticate,
  validate(updateUserSchema._def.schema),
  updateUserController
);

router.delete("/me", authenticate, deleteUserController);

export default router;
