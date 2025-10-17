import { useState, useCallback, useEffect } from "react";
import { ReviewFilters, ReviewSummary } from "../types/review";
import { reviewService } from "../services/reviewService";

interface UseAlbumReviewSummaryOptions {
  albumId: number;
  initialFilters?: ReviewFilters;
}

export function useAlbumReviewSummary({
  albumId,
  initialFilters = {},
}: UseAlbumReviewSummaryOptions) {
  const [songs, setSongs] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>(initialFilters);

  const fetchAlbumReviewSummary = useCallback(async () => {
    if (!albumId) return;

    try {
      setLoading(true);
      const result = await reviewService.getAlbumReviewSummary(
        albumId,
        filters
      );

      setSongs(result.songs);
      setError(null);
    } catch (err) {
      console.error("Error fetching album review summary:", err);
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [albumId, filters]);

  useEffect(() => {
    fetchAlbumReviewSummary();
  }, [fetchAlbumReviewSummary]);

  return {
    songs,
    loading,
    error,
    setFilters,
    refreshSummary: fetchAlbumReviewSummary,
  };
}
