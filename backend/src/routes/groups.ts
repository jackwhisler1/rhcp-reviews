import express from "express";
import {
  createGroupController,
  deleteGroupController,
  updateGroupController,
  sendInviteController,
  joinGroupController,
  getUserGroupsController,
} from "../controllers/group.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { groupSchema } from "../validators/group.validator";

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
