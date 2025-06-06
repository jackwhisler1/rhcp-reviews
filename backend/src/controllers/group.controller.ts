import { Request, Response } from "express";
import {
  createGroupService,
  deleteGroupService,
  updateGroupService,
  sendGroupInviteService,
  joinGroupService,
  getUserGroupsService,
  joinPublicGroupService,
  getGroupByIdService,
  getPublicGroupsService,
} from "../services/group.service.js";
import asyncHandler from "../middleware/asyncRouteHandler.js";

export const createGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const group = await createGroupService({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json(group);
  }
);

export const deleteGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteGroupService(Number(req.params.groupId), req.user!.id);
    res.sendStatus(204);
  }
);

export const updateGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const group = await updateGroupService(
      Number(req.params.groupId),
      req.body,
      req.user!.id
    );
    res.json(group);
  }
);

export const sendInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await sendGroupInviteService(
      Number(req.params.groupId),
      req.body.email,
      req.user!.id
    );
    res.json(result);
  }
);

export const joinGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const membership = await joinGroupService(req.body.code, req.user!.id);
    res.json(membership);
  }
);

export const getUserGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Request headers:", req.headers);
    console.log("User object from token:", req.user);
    const groups = await getUserGroupsService(req.user!.id);
    res.json(groups);
  }
);

export const getGroupByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    const group = await getGroupByIdService(groupId, userId);
    res.json(group);
  }
);

export const getPublicGroupsController = asyncHandler(
  async (req: Request, res: Response) => {
    const publicGroups = await getPublicGroupsService();
    res.json({ groups: publicGroups });
  }
);

export const joinPublicGroupController = asyncHandler(
  async (req: Request, res: Response) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    const membership = await joinPublicGroupService(groupId, userId);
    res.json(membership);
  }
);
