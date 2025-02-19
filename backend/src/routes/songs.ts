import express from "express";
import {
  getSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController,
} from "../controllers/song.controller.js";
import { validate } from "../middleware/validate.js";
import { songSchema } from "../validators/song.validator.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getSongsController);
router.get("/:songId", getSongController);
router.post("/", authenticate, validate(songSchema), createSongController);
router.patch(
  "/:songId",
  authenticate,
  validate(songSchema),
  updateSongController,
);
router.delete("/:songId", authenticate, deleteSongController);

export default router;
