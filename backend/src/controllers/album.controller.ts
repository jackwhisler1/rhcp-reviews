import { Request, Response } from "express";
import {
  createAlbumService,
  deleteAlbumService,
  getAlbumSongStatsService,
  getPaginatedAlbumsService,
  updateAlbumService,
} from "../services/album.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma.js";

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

export const getAlbumsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getPaginatedAlbumsService({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 25,
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

export const getAlbumSongStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const albumId = Number(req.params.albumId);
    const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
    const userFilter = req.query.userFilter === "true";

    if (userFilter && !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Authorization check for private groups
    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { isPrivate: true },
      });

      if (!group) return res.status(404).json({ error: "Group not found" });

      if (group.isPrivate) {
        if (!req.user) return res.status(403).json({ error: "Access denied" });

        const membership = await prisma.userGroup.findUnique({
          where: { userId_groupId: { userId: req.user.id, groupId } },
        });

        if (!membership)
          return res.status(403).json({ error: "Not a group member" });
      }
    }

    const stats = await getAlbumSongStatsService({
      albumId,
      groupId,
      userId: userFilter ? req.user?.id : undefined,
    });

    res.json(stats);
  }
);
