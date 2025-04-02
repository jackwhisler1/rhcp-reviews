import { useState, useEffect, useCallback } from "react";
import { FiltersState, SongStat } from "../types/rhcp-types";
import { getAlbumStats } from "../services/albumService";

export const useAlbumStats = (albumId: number, filters: FiltersState) => {
  const [stats, setStats] = useState<SongStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use useCallback to create a stable function reference
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {};

      // Only add groupId if it's not "all"
      if (filters.groupId && filters.groupId !== "all") {
        params.groupId = filters.groupId;
      }

      // Only add userId if showUserOnly is true and userId is not "all"
      if (filters.showUserOnly && filters.userId && filters.userId !== "all") {
        params.userId = filters.userId;
      }

      console.log("Fetching album stats with params:", params);
      const data = await getAlbumStats(albumId, params);

      // Make sure the result is an array
      if (Array.isArray(data)) {
        setStats(data);
      } else {
        console.warn("Unexpected response format:", data);
        setStats([]);
      }
    } catch (err: any) {
      console.error("Error fetching album stats:", err);

      // Set a user-friendly error message
      if (err?.response?.status === 403) {
        setError(
          "Forbidden: You don't have permission to view these group ratings"
        );
      } else if (err?.response?.status === 401) {
        setError("You need to log in to view these ratings");
      } else {
        setError(err.message || "Failed to load song statistics");
      }

      // Set empty stats
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [albumId, filters]);

  // Function to manually trigger a refresh
  const refreshStats = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (albumId) fetchStats();
  }, [albumId, filters, fetchStats, refreshTrigger]);

  return { stats, loading, error, refreshStats };
};
