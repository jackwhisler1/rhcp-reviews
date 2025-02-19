import { Request, Response } from "express";
import {
  createAlbumService,
  deleteAlbumService,
  getAlbumStatsService,
  getPaginatedAlbumsService,
  updateAlbumService,
} from "../services/album.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "@/db/prisma.js";

export const createAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const album = await createAlbumService(req.body);
      res.status(201).json(album);
    } catch (error) {
      console.error("Album creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
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

export const updateAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    const album = await updateAlbumService(Number(req.params.id), req.body);
    res.json(album);
  }
);

export const deleteAlbumController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteAlbumService(Number(req.params.id));
    res.sendStatus(204);
  }
);
