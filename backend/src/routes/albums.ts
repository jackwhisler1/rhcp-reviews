import express from "express";
import {
  createAlbumController,
  getAlbumStatsController,
  getAlbumsController,
} from "../controllers/album.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { albumSchema } from "../validators/album.validator";

const router = express.Router();

router.post("/", authenticate, validate(albumSchema), createAlbumController);
router.get("/stats/:albumId", getAlbumStatsController);
router.get("/", getAlbumsController);

export default router;
