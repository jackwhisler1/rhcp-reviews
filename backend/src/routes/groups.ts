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
import prisma from "@/db/prisma.js";
import { NotFoundError, AuthenticationError } from "@/errors/customErrors.js";
import asyncRouteHandler from "@/middleware/asyncRouteHandler.js";

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
router.get(
  "/:groupId/members",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const groupId = parseInt(req.params.groupId);

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, isPrivate: true },
    });

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if the user is a member of this group if it's private
    if (group.isPrivate) {
      const userMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: groupId,
          },
        },
      });

      if (!userMembership) {
        throw new AuthenticationError("You don't have access to this group");
      }
    }

    // Get all members of the group
    const groupMembers = await prisma.userGroup.findMany({
      where: { groupId: groupId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    // Format the response
    const members = groupMembers.map(
      (member: {
        user: { id: any; username: any; email: any; image: any };
        role: any;
        joinedAt: any;
      }) => ({
        id: member.user.id,
        username: member.user.username,
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        joinedAt: member.joinedAt,
      })
    );

    res.json({ members });
  })
);
export default router;
