import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import asyncRouteHandler from "../middleware/asyncRouteHandler.js";
import prisma from "../db/prisma";

const router = express.Router();

// Get all songs
router.get(
  "/",
  asyncRouteHandler(async (req: Request, res: Response) => {
    try {
      const songs = await prisma.song.findMany();
      res.json(songs);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Error fetching songs" });
    }
  })
);

router.get(
  "/:songId",
  asyncRouteHandler(async (req: Request, res: Response) => {
    const { songId } = req.params;

    try {
      const song = await prisma.song.findUnique({
        where: { id: Number(songId) },
      });
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Error fetching song" });
    }
  })
);

export default router;
