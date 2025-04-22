import express from "express";
import {
  createGroupController,
  deleteGroupController,
  updateGroupController,
  sendInviteController,
  joinGroupController,
  getUserGroupsController,
  getPublicGroupsController,
  getGroupByIdController,
  joinPublicGroupController,
} from "../controllers/group.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { groupSchema } from "../validators/group.validator.js";
import { groupAdminGuard } from "../middleware/groupAdminGuard.js";
import asyncRouteHandler from "../middleware/asyncRouteHandler.js";
import prisma from "@/db/prisma.js";
import {
  NotFoundError,
  AuthenticationError,
  ValidationError,
} from "@/errors/customErrors.js";

const router = express.Router();

// Get user's groups
router.get("/", authenticate, getUserGroupsController);

// Get public groups
router.get("/public", getPublicGroupsController);

// Get specific group details
router.get("/:groupId", authenticate, getGroupByIdController);

// Create a new group
router.post("/", authenticate, validate(groupSchema), createGroupController);

// Update group details (admin only)
router.patch(
  "/:groupId",
  authenticate,
  validate(groupSchema),
  groupAdminGuard,
  updateGroupController
);

// Delete a group (admin only)
router.delete(
  "/:groupId",
  authenticate,
  groupAdminGuard,
  deleteGroupController
);

// Send invitation to join private group (admin only)
router.post(
  "/:groupId/invite",
  authenticate,
  groupAdminGuard,
  sendInviteController
);

// Join a group using invite code
router.post("/join", authenticate, joinGroupController);

// Join a public group
router.post("/:groupId/join", authenticate, joinPublicGroupController);

// Get members of a group
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
    const members = groupMembers.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    res.json({ members });
  })
);

// Leave a group
router.delete(
  "/:groupId/members",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user?.id!;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if user is a member of the group
    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError("You are not a member of this group");
    }

    // Count admins in the group
    const adminCount = await prisma.userGroup.count({
      where: {
        groupId,
        role: "admin",
      },
    });

    // Prevent the last admin from leaving
    if (adminCount === 1 && membership.role === "admin") {
      throw new ValidationError(
        "Cannot leave group as you are the last admin. Transfer admin rights or delete the group instead.",
        { adminCount, groupId }
      );
    }

    // Remove user from group
    await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    res.status(200).json({ message: "Successfully left group" });
  })
);

export default router;
