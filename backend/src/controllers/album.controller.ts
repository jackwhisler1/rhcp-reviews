import { Request, Response, NextFunction } from "express";
import {
  createAlbumService,
  getAlbumStatsService,
  getPaginatedAlbumsService,
} from "../services/album.service";
import asyncHandler from "../middleware/asyncRouteHandler";

export const createAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    const album = await createAlbumService(req.body);
    res.status(201).json(album);
  }
);

export const getAlbumStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await getAlbumStatsService(Number(req.params.albumId));
    res.json(stats);
  }
);

export const getAlbumsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getPaginatedAlbumsService({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search?.toString(),
    });
    res.json(result);
  }
);
