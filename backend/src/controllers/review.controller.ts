import { NextFunction, Request, Response } from "express";
import {
  createReviewService,
  deleteReviewService,
  getAlbumReviewSummaryService,
  getReviewsService,
  getSongReviewsService,
  getUserReviewForSongService,
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
    console.log("Review GET query:", req.query); // Debugging log

    const result = await getReviewsService({
      ...req.query,
      songId: req.query.songId ? Number(req.query.songId) : undefined,
      albumId: req.query.albumId ? Number(req.query.albumId) : undefined,
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

export const getSongReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log(
    "GET /api/reviews/song/:songId hit",
    req.params.songId,
    req.query
  );

  try {
    const songId = Number(req.params.songId);
    if (!songId) {
      res.status(400).json({ error: "songId required" });
      return;
    }

    const result = await getSongReviewsService(songId, req.user?.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
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

export const getUserReviewForSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, songId } = req.params;

    if (!userId || !songId) {
      return res
        .status(400)
        .json({ error: "User ID and Song ID are required" });
    }

    const result = await getUserReviewForSongService(
      parseInt(userId),
      parseInt(songId)
    );

    res.json(result);
  }
);
export const getAlbumReviewSummaryController = asyncHandler(
  async (req: Request, res: Response) => {
    const albumId = Number(req.params.albumId);

    // Extract filters from query
    const filters = {
      groupId: req.query.groupId ? Number(req.query.groupId) : undefined,
      minRating: req.query.minRating?.toString(),
      maxRating: req.query.maxRating?.toString(),
    };

    const result = await getAlbumReviewSummaryService(albumId, filters);
    res.json(result);
  }
);
