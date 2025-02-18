import express from "express";
import asyncRouteHandler from "../middleware/asyncRouteHandler";
import prisma from "../db/prisma";
import { authenticate } from "../middleware/auth";
import crypto from "crypto";
import { groupAdminGuard } from "../middleware/groupAdminGuard";
import { sendInvitationEmail } from "../services/emailService";
import { NotFoundError, BadRequestError } from "../errors/customErrors";

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const groups = await prisma.userGroup.findMany({
      where: { userId: req.user!.id },
      include: { group: true },
    });
    res.json(groups.map((g) => g.group));
  })
);

router.post(
  "/",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const { name, isPrivate } = req.body;

    const group = await prisma.group.create({
      data: {
        name,
        isPrivate,
        inviteCode: isPrivate ? crypto.randomBytes(6).toString("hex") : null,
        members: {
          create: { userId: req.user!.id, role: "admin" },
        },
      },
    });

    res.status(201).json(group);
  })
);

router.delete(
  "/:groupId",
  authenticate,
  groupAdminGuard,
  asyncRouteHandler(async (req, res) => {
    await prisma.group.delete({
      where: { id: Number(req.params.groupId) },
    });
    res.sendStatus(204);
  })
);

router.patch(
  "/:groupId",
  authenticate,
  groupAdminGuard,
  asyncRouteHandler(async (req, res) => {
    const group = await prisma.group.update({
      where: { id: Number(req.params.groupId) },
      data: req.body,
    });
    res.json(group);
  })
);

router.post(
  "/:groupId/invite",
  authenticate,
  groupAdminGuard,
  asyncRouteHandler(async (req, res) => {
    const group = await prisma.group.findUniqueOrThrow({
      where: { id: Number(req.params.groupId) },
    });

    if (!group.isPrivate) {
      throw new BadRequestError("Public groups don't require invitations");
    }

    await sendInvitationEmail(req.body.email, group.name, group.inviteCode!);

    res.json({ message: "Invitation sent" });
  })
);

router.post(
  "/join",
  authenticate,
  asyncRouteHandler(async (req, res) => {
    const group = await prisma.group.findFirst({
      where: { inviteCode: req.body.code },
    });

    if (!group) throw new NotFoundError("Invalid invitation code");

    await prisma.userGroup.create({
      data: {
        userId: req.user!.id,
        groupId: group.id,
        role: "member",
      },
    });

    res.json(group);
  })
);

export default router;
