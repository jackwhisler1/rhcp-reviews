import { useState, useEffect, useCallback } from "react";
import { Group } from "../types/rhcp-types";
import { useAuth } from "../context/AuthContext";
import { fetchUserGroups } from "../services/groupService"; // Correct import

export const useUserGroups = (userId?: number) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchGroups = useCallback(async () => {
    // Skip if no userId provided and no logged-in user
    if (!userId && !user?.id) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Determine which ID to use (provided ID or logged in user)
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the service function with the targetUserId
      console.log(`Fetching groups for user ID: ${targetUserId}`);
      const groupsData = await fetchUserGroups(targetUserId);

      // Check if we got an array back
      if (Array.isArray(groupsData)) {
        setGroups(groupsData);
      } else {
        console.warn("Unexpected response format:", groupsData);
        setGroups([]);
      }
    } catch (err: any) {
      console.error("Error fetching user groups:", err);
      setError("Unable to load groups at this time");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Add a manual refresh function
  const refreshGroups = () => {
    fetchGroups();
  };

  return { groups, loading, error, refreshGroups };
};
