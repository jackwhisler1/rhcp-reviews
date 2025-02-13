import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Get all songs in an album
router.get("/:albumId", async (req, res) => {
  const { albumId } = req.params;

  try {
    const songs = await prisma.song.findMany({
      where: { albumId: Number(albumId) },
    });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching songs" });
  }
});

export default router;
