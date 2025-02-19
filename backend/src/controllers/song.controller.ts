import { Request, Response } from "express";
import {
  getSongsService,
  getSongService,
  createSongService,
  updateSongService,
  deleteSongService,
} from "../services/song.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const getSongsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getSongsService({
      albumId: req.query.albumId?.toString(),
      search: req.query.search?.toString(),
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    res.json(result);
  },
);

export const getSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await getSongService(Number(req.params.songId));
    res.json(song);
  },
);

export const createSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await createSongService(req.body);
    res.status(201).json(song);
  },
);

export const updateSongController = asyncHandler(
  async (req: Request, res: Response) => {
    const song = await updateSongService(Number(req.params.songId), req.body);
    res.json(song);
  },
);

export const deleteSongController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteSongService(Number(req.params.songId));
    res.sendStatus(204);
  },
);
