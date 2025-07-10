import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../errors/customErrors.js";

// Type for review filters
interface ReviewFilters {
  groups?: string;
  minRating?: string;
  maxRating?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  page?: string;
  userId?: number;
}

// Type for parsed filter values
interface ParsedFilters {
  groupIds?: number[];
  groupMemberIds?: number[];
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  page: number;
  userId?: number;
}

export const createReviewService = async (data: {
  content?: string;
  rating: number;
  songId: number;
  userId: number;
}) => {
  // Validation
  if (data.rating < 0 || data.rating > 10) {
    throw new ValidationError("Rating must be between 0 and 10", {
      rating: "Invalid rating value",
    });
  }

  // Verify song exists
  const song = await prisma.song.findUnique({
    where: { id: data.songId },
  });
  if (!song) throw new NotFoundError("Song not found");

  // Create review
  return prisma.review.create({
    data: {
      content: data.content,
      rating: data.rating,
      songId: data.songId,
      userId: data.userId,
    },
  });
};

export const getReviewsService = async (filters: ReviewFilters) => {
  const parsed = await parseFilters(filters);

  const where: Prisma.ReviewWhereInput = buildWhereClause(parsed);

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: {
        author: { select: { username: true, image: true } },
        song: true,
      },
      take: parsed.limit,
      skip: (parsed.page - 1) * parsed.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews,
    meta: {
      total,
      page: parsed.page,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
};

export const updateReviewService = async (
  reviewId: number,
  userId: number,
  data: {
    content?: string;
    rating: number;
  }
) => {
  // Validate rating
  if (data.rating < 0 || data.rating > 10) {
    throw new ValidationError("Rating must be between 0 and 10", {
      rating: "Invalid rating value",
    });
  }

  // Find the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Check if the user owns the review
  if (review.userId !== userId) {
    throw new ForbiddenError("Not authorized to update this review");
  }

  // Update the review
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      content: data.content,
      rating: data.rating,
    },
  });
};

export const deleteReviewService = async (reviewId: number, userId: number) => {
  // Find the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Check if the user owns the review
  if (review.userId !== userId) {
    throw new ForbiddenError("Not authorized to delete this review");
  }

  // Delete the review
  return prisma.review.delete({
    where: { id: reviewId },
  });
};

export const getSongReviewsService = async (
  songId: number,
  userId?: number
) => {
  const where: Prisma.ReviewWhereInput = {
    songId,
  };

  const reviews = await prisma.review.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    reviews,
    total: reviews.length,
  };
};

// Helper function to parse filter parameters
const parseFilters = async (filters: ReviewFilters): Promise<ParsedFilters> => {
  const groupIds = filters.groups?.split(",").map(Number).filter(Boolean);

  // Get userIds for those groups
  let groupMemberIds: number[] = [];
  if (groupIds && groupIds.length > 0) {
    const memberships = await prisma.userGroup.findMany({
      where: { groupId: { in: groupIds } },
      select: { userId: true },
    });
    groupMemberIds = memberships.map((m) => m.userId);
  }

  return {
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
    startDate: parseDate(filters.startDate),
    endDate: parseDate(filters.endDate),
    limit: Math.min(Number(filters.limit) || 20, 100),
    page: Math.max(Number(filters.page) || 1, 1),
    userId: filters.userId,
    groupIds,
    groupMemberIds,
  };
};

// Helper function to build Prisma where clause
const buildWhereClause = (parsed: ParsedFilters): Prisma.ReviewWhereInput => {
  const filters: Prisma.ReviewWhereInput[] = [];

  // Filter by group members if applicable
  if (parsed.groupMemberIds && parsed.groupMemberIds.length > 0) {
    filters.push({ userId: { in: parsed.groupMemberIds } });
  }

  if (parsed.minRating !== undefined) {
    filters.push({ rating: { gte: parsed.minRating } });
  }

  if (parsed.maxRating !== undefined) {
    filters.push({ rating: { lte: parsed.maxRating } });
  }

  if (parsed.startDate !== undefined) {
    filters.push({ createdAt: { gte: parsed.startDate } });
  }

  if (parsed.endDate !== undefined) {
    filters.push({ createdAt: { lte: parsed.endDate } });
  }

  return {
    AND: filters,
  };
};

// Date validation helper
const parseDate = (dateString?: string): Date | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
};

export const getUserSongReviewsService = async (
  userId: number,
  songIds: number[]
) => {
  if (!userId || !songIds.length) {
    return { reviews: [] };
  }

  const reviews = await prisma.review.findMany({
    where: {
      userId,
      songId: { in: songIds },
    },
    select: {
      id: true,
      songId: true,
      rating: true,
      content: true,
      createdAt: true,
    },
  });

  return {
    reviews,
    total: reviews.length,
  };
};

export const getUserReviewForSongService = async (
  userId: number,
  songId: number
) => {
  if (!userId || !songId) {
    return { review: null };
  }

  const review = await prisma.review.findFirst({
    where: {
      userId,
      songId,
    },
    select: {
      id: true,
      songId: true,
      rating: true,
      content: true,
      createdAt: true,
      userId: true,
    },
  });

  return {
    review,
  };
};
