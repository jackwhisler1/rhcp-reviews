import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../errors/customErrors";
import crypto from "crypto";
import { sendInvitationEmail } from "./email.service";

interface CreateGroupInput {
  name: string;
  description?: string;
  isPrivate: boolean;
  userId: number;
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export const createGroupService = async (data: CreateGroupInput) => {
  if (!data.name || data.name.trim().length < 2) {
    throw new BadRequestError("Group name must be at least 2 characters");
  }

  return prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
      inviteCode: data.isPrivate ? crypto.randomBytes(6).toString("hex") : null,
      members: {
        create: {
          userId: data.userId,
          role: "admin",
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { username: true, image: true },
          },
        },
      },
    },
  });
};

export const deleteGroupService = async (groupId: number, userId: number) => {
  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  return prisma.group.delete({
    where: { id: groupId },
  });
};

export const updateGroupService = async (
  groupId: number,
  data: UpdateGroupInput,
  userId: number
) => {
  const membership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }

  return prisma.group.update({
    where: { id: groupId },
    data,
    include: {
      members: true,
    },
  });
};

export const sendGroupInviteService = async (
  groupId: number,
  email: string,
  userId: number
) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!group) throw new NotFoundError("Group not found");
  if (!group.members[0] || group.members[0].role !== "admin") {
    throw new ForbiddenError("Admin privileges required");
  }
  if (!group.isPrivate) {
    throw new BadRequestError("Public groups don't require invitations");
  }

  await sendInvitationEmail(email, group.name, group.inviteCode!);
  return { message: "Invitation sent" };
};

export const joinGroupService = async (inviteCode: string, userId: number) => {
  const group = await prisma.group.findFirst({
    where: { inviteCode },
  });

  if (!group) throw new NotFoundError("Invalid invitation code");

  const existingMembership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId: group.id,
      },
    },
  });

  if (existingMembership) {
    throw new BadRequestError("Already a group member");
  }

  return prisma.userGroup.create({
    data: {
      userId,
      groupId: group.id,
      role: "member",
    },
    include: {
      group: true,
    },
  });
};

export const getUserGroupsService = async (userId: number) => {
  return prisma.userGroup.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
        },
      },
    },
  });
};

export const getPaginatedGroupsService = async (
  userId: number,
  page: number,
  limit: number
) => {
  const [total, groups] = await prisma.$transaction([
    prisma.userGroup.count({ where: { userId } }),
    prisma.userGroup.findMany({
      where: { userId },
      include: { group: true },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data: groups, total, page, totalPages: Math.ceil(total / limit) };
};
