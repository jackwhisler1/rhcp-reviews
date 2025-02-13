import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Post a review
router.post("/", async (req, res) => {
  const { userId, songId, rating, reviewText } = req.body;

  try {
    const review = await prisma.review.create({
      data: {
        userId: userId,
        songId: songId,
        rating: rating,
        reviewText: reviewText,
      },
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Error posting review" });
  }
});

export default router;
