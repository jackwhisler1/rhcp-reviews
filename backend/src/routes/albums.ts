import express from "express";
import {
  createAlbumController,
  getAlbumStatsController,
  getAlbumsController,
} from "../controllers/album.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { albumSchema } from "../validators/album.validator.js";

const router = express.Router();

router.post("/", authenticate, validate(albumSchema), createAlbumController);
router.get("/stats/:albumId", getAlbumStatsController);
router.get("/", getAlbumsController);

export default router;
