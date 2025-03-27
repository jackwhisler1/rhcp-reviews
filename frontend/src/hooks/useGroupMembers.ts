import { useState, useEffect } from "react";
import { GroupMember } from "../types/rhcp-types";
import { fetchGroupMembers } from "../services/groupService";

export const useGroupMembers = (groupId: string) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      // Skip fetching if "all" is selected
      if (groupId === "all") {
        setMembers([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Make sure we have a valid groupId
        if (!groupId) {
          setMembers([]);
          return;
        }

        const data = await fetchGroupMembers(groupId);
        setMembers(data);
      } catch (err: any) {
        console.error("Error in useGroupMembers:", err);
        setError(err.message || "Failed to load group members");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const refetch = async () => {
    if (groupId === "all") return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchGroupMembers(groupId);
      setMembers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load group members");
    } finally {
      setLoading(false);
    }
  };

  return { members, loading, error, refetch };
};
