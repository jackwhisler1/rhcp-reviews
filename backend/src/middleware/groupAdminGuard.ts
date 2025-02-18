import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma.js";
import { ForbiddenError } from "../errors/customErrors.js";

export const groupAdminGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const groupId = Number(req.params.groupId);

  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId: req.user!.id,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  next();
};
