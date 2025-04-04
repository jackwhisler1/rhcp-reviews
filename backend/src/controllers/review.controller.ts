import { Request, Response } from "express";
import {
  createReviewService,
  deleteReviewService,
  getReviewsService,
  getSongReviewsService,
  getUserSongReviewsService,
  updateReviewService,
} from "../services/review.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const createReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await createReviewService({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json(review);
  }
);

export const getReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getReviewsService({
      ...req.query,
      userId: req.user?.id,
    });
    res.json(result);
  }
);

export const updateReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await updateReviewService(parseInt(id), req.user!.id, {
      ...req.body,
    });
    res.json(review);
  }
);

export const deleteReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteReviewService(parseInt(id), req.user!.id);
    res.status(204).end();
  }
);

export const getSongReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { songId, groupId } = req.query;

    if (!songId) {
      return res.status(400).json({ error: "Song ID is required" });
    }

    const result = await getSongReviewsService(
      parseInt(songId as string),
      groupId ? parseInt(groupId as string) : undefined,
      req.user?.id
    );

    res.json(result);
  }
);

export const getUserSongReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, songIds } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!songIds) {
      return res.status(400).json({ error: "Song IDs are required" });
    }

    // Parse the comma-separated list of song IDs
    const parsedSongIds = (songIds as string)
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    const result = await getUserSongReviewsService(
      parseInt(userId as string),
      parsedSongIds
    );

    res.json(result);
  }
);
