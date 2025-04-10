import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserGroups } from "../services/groupService";
import { Group } from "../types/rhcp-types";

export const useUserGroups = (userId?: number) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Store the last fetched userId to prevent redundant requests
  const lastFetchedRef = useRef<number | null>(null);

  useEffect(() => {
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

    // Skip if we already fetched data for this userId
    if (lastFetchedRef.current === targetUserId) {
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call the service function with the targetUserId
        console.log(`Fetching groups for user ID: ${targetUserId}`);
        const groupsData = await fetchUserGroups(targetUserId);
        lastFetchedRef.current = targetUserId;

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
    };

    fetchGroups();
  }, [userId, user?.id]); // Simplified dependencies

  // Add a manual refresh function
  const refreshGroups = useCallback(() => {
    // Reset the lastFetchedRef to force a new fetch
    lastFetchedRef.current = null;

    // Skip if no userId provided and no logged-in user
    if (!userId && !user?.id) return;

    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setLoading(true);
    fetchUserGroups(targetUserId)
      .then((groupsData) => {
        if (Array.isArray(groupsData)) {
          setGroups(groupsData);
        } else {
          setGroups([]);
        }
        lastFetchedRef.current = targetUserId;
      })
      .catch((err) => {
        console.error("Error refreshing groups:", err);
        setError("Unable to refresh groups at this time");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, user?.id]);

  return { groups, loading, error, refreshGroups };
};
