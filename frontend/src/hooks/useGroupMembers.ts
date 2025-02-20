import { useState, useEffect } from "react";
import { GroupMember } from "../types/rhcp-types";
import { fetchGroupMembers } from "../services/groupService";

export const useGroupMembers = (groupId: string) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchGroupMembers(groupId);
        setMembers(data);
      } catch (err: any) {
        setError(err.message || "Failed to load group members");
      } finally {
        setLoading(false);
      }
    };

    if (groupId !== "all") fetchMembers();
  }, [groupId]);

  return { members, loading, error };
};
