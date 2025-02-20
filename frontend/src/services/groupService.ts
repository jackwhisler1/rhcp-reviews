import { fetchWrapper } from "./api";
import { Group, GroupMember } from "../types/rhcp-types";

export const fetchGroupMembers = async (
  groupId: string
): Promise<GroupMember[]> => {
  if (groupId === "all") return [];
  return fetchWrapper(`/groups/${groupId}/members`);
};

export const fetchUserGroups = async (userId: number): Promise<Group[]> => {
  return fetchWrapper(`/users/${userId}/groups`);
};
