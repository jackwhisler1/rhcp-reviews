import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import asyncRouteHandler from "../middleware/asyncRouteHandler.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const router = express.Router();

interface CreateAlbumRequestBody {
  title: string;
  releaseDate: string; 
  artworkUrl: string;
}

// Serve static files from the 'images' directory for album artwork
const imagesPath = path.join(__dirname, "../images");
router.use("/images", express.static(imagesPath));

// Get all albums
router.get(
  "/",
  asyncRouteHandler(async (req: Request, res: Response) => {
    try {
      const albums = await prisma.album.findMany();
      res.json(albums);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Error fetching albums" });
    }
  })
);

router.get(
  "/:albumId",
  asyncRouteHandler(async (req: Request, res: Response) => {
    const { albumId } = req.params;

    try {
      const songs = await prisma.song.findMany({
        where: { albumId: Number(albumId) },
      });
      res.json(songs);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Error fetching songs" });
    }
  })
);

router.post(
  "/",
  asyncRouteHandler(
    async (
      req: Request<{}, {}, CreateAlbumRequestBody>,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { title, releaseDate, artworkUrl } = req.body;

        if (!title || !releaseDate || !artworkUrl) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const album = await prisma.album.create({
          data: {
            title,
            releaseDate: new Date(releaseDate),
            artworkUrl,
          },
        });

        res.status(201).json(album);
      } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Error creating album" });
        next(error); // Pass error to error handling middleware
      }
    }
  )
);

export default router;
