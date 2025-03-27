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

      const params = {
        groupId: filters.groupId,
        userId: filters.showUserOnly ? filters.userId : undefined,
      };

      const data = await getAlbumStats(albumId, params);
      setStats(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching album stats:", err);
      setError(err.message || "Failed to load song statistics");
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
