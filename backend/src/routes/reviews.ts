import express from "express";
import {
  createReviewController,
  getReviewsController,
} from "../controllers/review.controller";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.post("/", authenticate, createReviewController);
router.get("/", getReviewsController);

export default router;
