import express from "express";
import {
  createReviewController,
  getReviewsController,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticate, createReviewController);
router.get("/", getReviewsController);

export default router;
