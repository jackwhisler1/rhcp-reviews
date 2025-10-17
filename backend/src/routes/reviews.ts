import express from "express";
import {
  createReviewController,
  deleteReviewController,
  getAlbumReviewSummaryController,
  getReviewsController,
  getSongReviewsController,
  getUserReviewForSongController,
  getUserSongReviewsController,
  updateReviewController,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create a new review (requires authentication)
router.post("/", authenticate, createReviewController);

router.get(
  "/",
  (req, res, next) => {
    console.log("Review GET request received", {
      query: req.query,
      url: req.url,
      originalUrl: req.originalUrl,
    });
    next();
  },
  getReviewsController
);

// Get reviews for a specific song
router.get("/song/:songId", getSongReviewsController);

// Get reviews for specific songs by a user
router.get("/user/songs", getUserSongReviewsController);

// Get a specific user's review for a song
router.get("/user/:userId/song/:songId", getUserReviewForSongController);

// Update a review (requires authentication)
router.put("/:id", authenticate, updateReviewController);

// Delete a review (requires authentication)
router.delete("/:id", authenticate, deleteReviewController);

router.get("/album/:albumId/summary", getAlbumReviewSummaryController);

export default router;
