// Inside useAlbumStats.js
import { useState, useEffect, useCallback } from "react";
import { FiltersState, SongStat } from "../types/rhcp-types";
import { fetchWrapper } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const useAlbumStats = (albumId: number, filters: FiltersState) => {
  const [stats, setStats] = useState<SongStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Helper function to get auth headers, with option to skip auth
  const getAuthHeader = (requireAuth = true) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (requireAuth && user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return { headers };
  };

  // Use useCallback to create a stable function reference
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params for album stats
      const statsParams = new URLSearchParams();
      if (filters.groupId !== "all") {
        statsParams.append("groupId", filters.groupId);
      }
      if (filters.showUserOnly && filters.userId !== "all") {
        statsParams.append("userFilter", "true");
      }

      // Fetch basic stats
      const data = await fetchWrapper(
        `/albums/${albumId}/songs/stats?${statsParams.toString()}`,
        getAuthHeader(false)
      );

      // If user is authenticated, fetch their reviews for this album to populate userRating
      let songStats = Array.isArray(data) ? data : [];

      if (isAuthenticated && user?.id) {
        try {
          // Make a request to get all user's reviews for this album's songs
          const songIds = songStats.map((song) => song.id).join(",");
          const userReviewsParams = new URLSearchParams({
            userId: user.id.toString(),
            songIds,
          });

          const userReviews = await fetchWrapper(
            `/reviews/user/songs?${userReviewsParams.toString()}`,
            getAuthHeader(true)
          );

          // If we get user reviews, merge them with the song stats
          if (userReviews && Array.isArray(userReviews.reviews)) {
            // Create a map of songId -> userRating
            const userRatingsMap: Record<number, number> = {};
            userReviews.reviews.forEach(
              (review: { songId: number; rating: number }) => {
                userRatingsMap[review.songId] = review.rating;
              }
            );

            // Update the song stats with user ratings
            songStats = songStats.map((song) => ({
              ...song,
              userRating: userRatingsMap[song.id] || song.userRating,
            }));
          }
        } catch (userReviewsError) {
          console.error("Error fetching user reviews:", userReviewsError);
          // Continue with the stats we have even if user reviews fail
        }
      }

      setStats(songStats);
    } catch (err: any) {
      console.error("Error fetching album stats:", err);
      setError(err.message || "Failed to load song statistics");
    } finally {
      setLoading(false);
    }
  }, [albumId, filters, user, isAuthenticated]);

  // Function to manually trigger a refresh
  const refreshStats = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (albumId) fetchStats();
  }, [albumId, filters, fetchStats, refreshTrigger]);

  return { stats, loading, error, refreshStats };
};
