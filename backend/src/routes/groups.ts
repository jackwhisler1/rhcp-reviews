import express from "express";
import {
  createGroupController,
  deleteGroupController,
  updateGroupController,
  sendInviteController,
  joinGroupController,
  getUserGroupsController,
} from "../controllers/group.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { groupSchema } from "../validators/group.validator.js";

const router = express.Router();

router.get("/", authenticate, getUserGroupsController);
router.post("/", authenticate, validate(groupSchema), createGroupController);
router.delete("/:groupId", authenticate, deleteGroupController);
router.patch(
  "/:groupId",
  authenticate,
  validate(groupSchema),
  updateGroupController
);
router.post("/:groupId/invite", authenticate, sendInviteController);
router.post("/join", authenticate, joinGroupController);

export default router;
