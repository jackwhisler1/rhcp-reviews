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
    try {
      const albumId = Number(req.params.albumId);
      const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const selectedUserId = req.query.selectedUserId
        ? Number(req.query.selectedUserId)
        : undefined;

      console.log(
        `Fetching album stats - albumId: ${albumId}, groupId: ${groupId}, userId: ${userId}, authenticated: ${!!req.user}`
      );

      // Public stats don't need authentication
      if (!groupId) {
        console.log("Fetching public album stats");
        const stats = await getAlbumSongStatsService({
          albumId,
          groupId: undefined,
          userId,
          selectedUserId,
        });
        return res.json(stats); // Using return to prevent further execution
      }

      // Group stats require authentication
      if (groupId && !req.user) {
        console.log("Attempted to access group stats without authentication");
        return res
          .status(401)
          .json({ error: "Authentication required for group stats" });
      }

      // Authorization check for private groups
      if (groupId) {
        console.log(`Checking group access for groupId: ${groupId}`);
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { isPrivate: true },
        });

        if (!group) {
          console.log("Group not found");
          return res.status(404).json({ error: "Group not found" });
        }

        if (group.isPrivate) {
          console.log("Checking membership for private group");
          // Must be authenticated for private groups
          if (!req.user) {
            console.log("No user authenticated for private group access");
            return res
              .status(401)
              .json({ error: "Authentication required for private group" });
          }

          // Must be a member of private groups
          const membership = await prisma.userGroup.findUnique({
            where: {
              userId_groupId: {
                userId: req.user.id,
                groupId,
              },
            },
          });

          if (!membership) {
            console.log(
              `User ${req.user.id} is not a member of private group ${groupId}`
            );
            return res.status(403).json({ error: "Not a group member" });
          }

          console.log(
            `User ${req.user.id} has access to private group ${groupId}`
          );
        } else {
          console.log("Group is public, proceeding with request");
        }
      }
      console.log(
        `selectedUserId from query: ${selectedUserId}, type: ${typeof selectedUserId}`
      );

      // If we got here, the user has the necessary permissions
      console.log("Fetching album stats with permissions validated");
      const stats = await getAlbumSongStatsService({
        albumId,
        groupId,
        selectedUserId,
        userId: req.query.userFilter === "true" ? req.user?.id : userId,
      });

      return res.json(stats); // Using return to prevent further execution
    } catch (error) {
      console.error("Error in getAlbumSongStatsController:", error);

      // Check if headers have already been sent
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ error: "Server error fetching album stats" });
      } else {
        console.error("Headers already sent, cannot send error response");
      }
    }
  }
);
