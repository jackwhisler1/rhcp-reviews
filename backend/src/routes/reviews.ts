import express from "express";
import {
  createReviewController,
  deleteReviewController,
  getReviewsController,
  getSongReviewsController,
  updateReviewController,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create a new review (requires authentication)
router.post("/", authenticate, createReviewController);

// Get all reviews (with filtering)
router.get("/", getReviewsController);

// Get reviews for a specific song
router.get("/song", getSongReviewsController);

// Update a review (requires authentication)
router.put("/:id", authenticate, updateReviewController);

// Delete a review (requires authentication)
router.delete("/:id", authenticate, deleteReviewController);

export default router;
