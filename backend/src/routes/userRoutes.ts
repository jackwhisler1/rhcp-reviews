import express from "express";
import { authenticate } from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma.js";
import { NotFoundError } from "../errors/customErrors.js";

const router = express.Router();

// Get groups for a specific user
router.get(
  "/:userId/groups",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the user's groups
    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            isPrivate: true,
            createdAt: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    // Format the response
    const groups = userGroups.map((ug) => ({
      id: ug.group.id,
      name: ug.group.name,
      description: ug.group.description,
      image: ug.group.image,
      isPrivate: ug.group.isPrivate,
      memberCount: ug.group._count.members,
      role: ug.role,
      joinedAt: ug.joinedAt,
      createdAt: ug.group.createdAt,
    }));

    res.json({ groups });
  })
);

export default router;
