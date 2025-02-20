import { useState, useEffect } from "react";
import { fetchUserGroups } from "../services/groupService";
import { Group } from "../types/rhcp-types";

export const useUserGroups = (userId?: number) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        if (userId) {
          const data = await fetchUserGroups(userId);
          setGroups(data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [userId]);

  return { groups, loading, error };
};
