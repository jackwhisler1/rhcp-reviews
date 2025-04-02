import express from "express";
import {
  createAlbumController,
  deleteAlbumController,
  getAlbumSongStatsController,
  getAlbumsController,
  updateAlbumController,
} from "../controllers/album.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createAlbumSchema,
  updateAlbumSchema,
} from "../validators/album.validator.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(createAlbumSchema),
  createAlbumController
);

router.get(
  "/:albumId/songs/stats",
  optionalAuthenticate,
  getAlbumSongStatsController
);

router.get("/", getAlbumsController);

router.put(
  "/:id",
  authenticate,
  validate(updateAlbumSchema),
  updateAlbumController
);

router.delete("/:id", authenticate, deleteAlbumController);

export default router;
