import { useState, useEffect } from "react";
import { FiltersState, SongStat } from "../types/rhcp-types";
import { getAlbumStats } from "../services/albumService";

export const useAlbumStats = (albumId: number, filters: FiltersState) => {
  const [stats, setStats] = useState<SongStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
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
        setError(err.message || "Failed to load song statistics");
      } finally {
        setLoading(false);
      }
    };

    if (albumId) fetchStats();
  }, [albumId, filters]);

  return { stats, loading, error };
};
