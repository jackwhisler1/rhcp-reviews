import express from "express";
import {
  getSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController,
} from "../controllers/song.controller";
import { validate } from "../middleware/validate";
import { songSchema } from "../validators/song.validator";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/", getSongsController);
router.get("/:songId", getSongController);
router.post("/", authenticate, validate(songSchema), createSongController);
router.patch(
  "/:songId",
  authenticate,
  validate(songSchema),
  updateSongController
);
router.delete("/:songId", authenticate, deleteSongController);

export default router;
