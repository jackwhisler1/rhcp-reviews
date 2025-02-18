import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import asyncRouteHandler from "../middleware/asyncRouteHandler";
import prisma from "../db/prisma";
import { AuthenticationError, ForbiddenError } from "../errors/customErrors";

const router = express.Router();

// Utility function to parse query params
const parseQueryParam = (param: unknown): string | undefined => {
  return Array.isArray(param) ? param[0] : param?.toString();
};

// Post a review
router.post(
  "/",
  asyncRouteHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();

    const { songId, rating, content, groupId } = req.body;

    // Group membership check
    if (groupId) {
      const membership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: req.user.id,
            groupId: groupId,
          },
        },
      });

      if (!membership) throw new ForbiddenError("Not a group member");
    }

    const review = await prisma.review.create({
      data: {
        content,
        rating,
        songId,
        userId: req.user.id,
        groupId: groupId ? Number(groupId) : null,
      },
    });

    res.status(201).json(review);
  })
);

router.get(
  "/",
  asyncRouteHandler(async (req, res) => {
    const {
      groups,
      minRating,
      maxRating,
      startDate,
      endDate,
      limit = 20,
      page = 1,
    } = req.query;

    // Parse group IDs
    const groupIds =
      parseQueryParam(groups)?.split(",").map(Number).filter(Boolean) || [];

    // Date validation
    const parseDate = (dateString: unknown): Date | undefined => {
      const date = new Date(parseQueryParam(dateString) || "");
      return isNaN(date.getTime()) ? undefined : date;
    };

    const where: Prisma.ReviewWhereInput = {
      AND: [
        {
          OR: [
            { groupId: null }, // Public reviews
            ...(groupIds.length > 0
              ? [
                  {
                    group: {
                      id: { in: groupIds },
                      members: { some: { userId: req.user?.id } },
                    },
                  },
                ]
              : []),
          ],
        },
        ...(minRating
          ? [{ rating: { gte: Number(parseQueryParam(minRating)) } }]
          : []),
        ...(maxRating
          ? [{ rating: { lte: Number(parseQueryParam(maxRating)) } }]
          : []),
        ...(startDate ? [{ createdAt: { gte: parseDate(startDate) } }] : []),
        ...(endDate ? [{ createdAt: { lte: parseDate(endDate) } }] : []),
      ].filter(Boolean),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: { select: { username: true, image: true } },
          song: true,
          group: { select: { name: true } },
        },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      data: reviews,
      meta: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

async function getGroupMembers(groupIds: number[]) {
  if (groupIds.length === 0) return [];
  return prisma.userGroup
    .findMany({
      where: { groupId: { in: groupIds } },
      select: { userId: true },
    })
    .then((users) => users.map((u) => u.userId));
}

export default router;
