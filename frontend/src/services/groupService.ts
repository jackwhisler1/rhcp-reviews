import { getCurrentUser } from "./authService";
import { fetchWrapper } from "./api";

// Set up auth headers
export const getAuthHeader = () => {
  const user = getCurrentUser();
  console.log(
    "Auth token:",
    user?.token ? `${user.token.substring(0, 15)}...` : "none"
  );

  // Create options object for fetch
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (user?.token) {
    headers["Authorization"] = `Bearer ${user.token}`;
  }

  return { headers };
};

/**
 * Fetch groups for a specific user
 */
export const fetchUserGroups = async (userId: number) => {
  try {
    console.log(`Fetching groups for user ${userId}`);
    const options = getAuthHeader();
    console.log("Request headers:", options);

    const data = await fetchWrapper(`/users/${userId}/groups`, options);
    return data.groups;
  } catch (error) {
    console.error(`Error fetching groups for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetch groups for the current user
 */
export const fetchMyGroups = async () => {
  try {
    const data = await fetchWrapper("/groups", getAuthHeader());
    return data;
  } catch (error) {
    console.error("Error fetching my groups:", error);
    throw error;
  }
};

/**
 * Fetch public groups
 */
export const fetchPublicGroups = async () => {
  try {
    const data = await fetchWrapper("/groups/public", getAuthHeader());
    return data.groups;
  } catch (error) {
    console.error("Error fetching public groups:", error);
    throw error;
  }
};

/**
 * Fetch details for a specific group
 */
export const fetchGroupDetails = async (groupId: string) => {
  try {
    const data = await fetchWrapper(`/groups/${groupId}`, getAuthHeader());
    return data;
  } catch (error) {
    console.error(`Error fetching details for group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Create a new group
 */
export const createGroup = async (groupData: any) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "POST",
      body: JSON.stringify(groupData),
    };

    return await fetchWrapper("/groups", options);
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

/**
 * Join a private group using an invite code
 */
export const joinGroup = async (
  codeOrId: string,
  isPublic: boolean = false
) => {
  try {
    // Different endpoints for joining public vs private groups
    const endpoint = isPublic ? `/groups/${codeOrId}/join` : "/groups/join";

    const payload = isPublic
      ? {} // No payload needed for public group join
      : { code: codeOrId };

    const options = {
      ...getAuthHeader(),
      method: "POST",
      body: JSON.stringify(payload),
    };

    return await fetchWrapper(endpoint, options);
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
};

/**
 * Fetch members of a specific group
 */
export const fetchGroupMembers = async (groupId: string) => {
  if (!groupId) {
    return [];
  }

  try {
    const data = await fetchWrapper(
      `/groups/${groupId}/members`,
      getAuthHeader()
    );
    return data.members;
  } catch (error) {
    console.error(`Error fetching members for group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Send an invitation to join a group
 */
export const sendGroupInvite = async (groupId: string, email: string) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "POST",
      body: JSON.stringify({ email }),
    };

    return await fetchWrapper(`/groups/${groupId}/invite`, options);
  } catch (error) {
    console.error(`Error sending invitation for group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId: string) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "DELETE",
    };

    return await fetchWrapper(`/groups/${groupId}/members`, options);
  } catch (error) {
    console.error(`Error leaving group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Delete a group (admin only)
 */
export const deleteGroup = async (groupId: string) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "DELETE",
    };

    return await fetchWrapper(`/groups/${groupId}`, options);
  } catch (error) {
    console.error(`Error deleting group ${groupId}:`, error);
    throw error;
  }
};
