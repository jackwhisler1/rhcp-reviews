import { Request, Response } from "express";
import {
  createReviewService,
  getReviewsService,
} from "../services/review.service";
import asyncHandler from "../middleware/asyncRouteHandler";

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
