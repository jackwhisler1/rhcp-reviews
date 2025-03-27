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
import prisma from "@/db/prisma.js";
import { NotFoundError } from "@/errors/customErrors.js";
import { getUserGroupsService } from "@/services/group.service.js";
import asyncRouteHandler from "@/middleware/asyncRouteHandler.js";

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
router.get(
  "/:userId/groups",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the user's groups
    const groups = await getUserGroupsService(userId);

    res.json({ groups });
  })
);

export default router;
