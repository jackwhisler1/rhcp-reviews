import prisma from "../db/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../errors/customErrors.js";
import crypto from "crypto";
import { sendInvitationEmail } from "./email.service.js";

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

export const getGroupByIdService = async (groupId: number, userId: number) => {
  // Find the group
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      inviteCode: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // For private groups, check if user is a member
  if (group.isPrivate) {
    const isMember = group.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenError("You don't have access to this group");
    }
  }

  // Get user's role in the group
  const userMembership = group.members.find(
    (member) => member.userId === userId
  );

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    image: group.image,
    isPrivate: group.isPrivate,
    inviteCode: group.inviteCode,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    role: userMembership?.role || null,
  };
};

export const getPublicGroupsService = async () => {
  const publicGroups = await prisma.group.findMany({
    where: { isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      createdAt: true,
      _count: {
        select: { members: true },
      },
    },
  });

  return publicGroups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    image: group.image,
    isPrivate: group.isPrivate,
    createdAt: group.createdAt,
    memberCount: group._count.members,
  }));
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

export const joinPublicGroupService = async (
  groupId: number,
  userId: number
) => {
  // Verify the group exists and is public
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new NotFoundError("Group not found");

  if (group.isPrivate) {
    throw new ForbiddenError("Cannot directly join a private group");
  }

  // Check if already a member
  const existingMembership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (existingMembership) {
    throw new BadRequestError("Already a group member");
  }

  // Create membership
  return prisma.userGroup.create({
    data: {
      userId,
      groupId,
      role: "member",
    },
    include: {
      group: true,
    },
  });
};

export const getUserGroupsService = async (userId: number) => {
  const userGroups = await prisma.userGroup.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
          inviteCode: true,
          createdAt: true,
          _count: {
            select: { members: true },
          },
        },
      },
    },
  });

  return userGroups.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
    description: membership.group.description,
    image: membership.group.image,
    isPrivate: membership.group.isPrivate,
    inviteCode: membership.group.inviteCode,
    memberCount: membership.group._count.members,
    role: membership.role,
    joinedAt: membership.joinedAt,
    createdAt: membership.group.createdAt,
  }));
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
