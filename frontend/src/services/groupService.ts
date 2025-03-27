import { getCurrentUser } from "./authService";
import { fetchWrapper } from "./api";

// Set up auth headers
const getAuthHeader = () => {
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
 * Join a group using an invite code
 */
export const joinGroup = async (code: any) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "POST",
      body: JSON.stringify({ code }),
    };

    return await fetchWrapper("/groups/join", options);
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
};

/**
 * Fetch members of a specific group
 */
export const fetchGroupMembers = async (groupId: any) => {
  if (!groupId || groupId === "all") {
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
