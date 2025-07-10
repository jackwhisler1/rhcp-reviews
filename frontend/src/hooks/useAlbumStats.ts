import { useState, useEffect, useCallback, useRef } from "react";
import { FiltersState, SongStat } from "../types/rhcp-types";
import { fetchWrapper } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const useAlbumStats = (
  albumId: number,
  filters: FiltersState,
  reviewUpdateCount = 0
) => {
  const [stats, setStats] = useState<SongStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Use a ref to track the previous stats for better comparison
  const prevStatsRef = useRef<SongStat[]>([]);

  // Track local updates to user ratings that might not be reflected in the API yet
  const pendingUserRatingsRef = useRef<{ [songId: number]: number }>({});

  // Helper function to get auth headers
  const getAuthHeader = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return { headers };
  }, [user]);

  // Function to merge new stats with previous userRatings when appropriate
  const mergeWithPrevStats = useCallback((newStats: SongStat[]) => {
    // If we don't have previous stats, just use the new ones with any pending ratings
    if (!prevStatsRef.current.length) {
      return newStats.map((song) => {
        // Check if we have a pending rating for this song
        if (pendingUserRatingsRef.current[song.id]) {
          return {
            ...song,
            userRating: pendingUserRatingsRef.current[song.id],
          };
        }
        return song;
      });
    }

    // Create a map of previous stats by song ID for easy lookup
    const prevStatsBySongId = new Map(
      prevStatsRef.current.map((song) => [song.id, song])
    );

    // Merge new stats with previous userRatings and pending ratings
    return newStats.map((newSong) => {
      const prevSong = prevStatsBySongId.get(newSong.id);
      const pendingRating = pendingUserRatingsRef.current[newSong.id];

      // Start with the new song data
      let mergedSong = { ...newSong };

      // If we have a pending rating, that takes highest priority
      if (pendingRating !== undefined) {
        mergedSong.currentUserRating = pendingRating;
      }
      // If the new song has a currentUserRating, use that (API responded with our rating)
      else if (
        newSong.currentUserRating !== undefined &&
        newSong.currentUserRating !== null
      ) {
        mergedSong.currentUserRating = newSong.currentUserRating;
      }
      // If the new song doesn't have a currentUserRating but previous did, preserve it
      else if (
        prevSong &&
        prevSong.currentUserRating !== undefined &&
        prevSong.currentUserRating !== null
      ) {
        mergedSong.currentUserRating = prevSong.currentUserRating;
      }

      if (
        newSong.selectedUserRating !== undefined &&
        newSong.selectedUserRating !== null
      ) {
        mergedSong.selectedUserRating = newSong.selectedUserRating;
      }

      return mergedSong;
    });
  }, []);

  // Method to manually set a user rating locally
  // This can be called when a user submits a rating but before the API refresh
  const setUserRating = useCallback((songId: number, rating: number) => {
    console.log(`Setting local user rating for song ${songId} to ${rating}`);

    // Update the pending ratings ref
    pendingUserRatingsRef.current = {
      ...pendingUserRatingsRef.current,
      [songId]: rating,
    };

    // Also update the current stats state immediately for UI feedback
    setStats((currentStats) =>
      currentStats.map((song) =>
        song.id === songId ? { ...song, currentUserRating: rating } : song
      )
    );
  }, []);

  // Fetch album stats
  const fetchStats = useCallback(async () => {
    if (!albumId) return;

    try {
      setLoading(true);

      // Build query params for album stats
      const statsParams = new URLSearchParams();

      // Add group filter if applicable
      if (filters.groupId !== "all") {
        statsParams.append("groupId", filters.groupId);
      }

      // Add selected user filter if applicable
      if (filters.userId !== "all" && filters.userId !== String(user?.id)) {
        statsParams.append("selectedUserId", filters.userId);
      }

      if (isAuthenticated && user?.id) {
        statsParams.append("userId", String(user.id));
      }

      // Special filter for showing only the current user's ratings
      if (filters.showUserOnly && isAuthenticated && user?.id) {
        statsParams.append("userFilter", "true");
      }

      const apiUrl = `/albums/${albumId}/songs/stats`;
      const queryString = statsParams.toString();
      const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;

      console.log(`Fetching stats from: ${fullUrl}`);

      try {
        const response = await fetchWrapper(fullUrl, getAuthHeader());

        // Ensure we have a valid response
        if (Array.isArray(response)) {
          // Process and validate the response data
          const validatedStats = response.map((song) => ({
            ...song,
            currentUserRating:
              typeof song.currentUserRating === "number"
                ? song.currentUserRating
                : null,
            selectedUserRating:
              typeof song.selectedUserRating === "number"
                ? song.selectedUserRating
                : null,
            publicAverage:
              typeof song.publicAverage === "number" ? song.publicAverage : 0,
            publicReviewCount:
              typeof song.publicReviewCount === "number"
                ? song.publicReviewCount
                : 0,
            groupAverage:
              typeof song.groupAverage === "number"
                ? song.groupAverage
                : song.groupAverage !== null && song.groupAverage !== undefined
                ? Number(song.groupAverage)
                : null,
            groupReviewCount:
              typeof song.groupReviewCount === "number"
                ? song.groupReviewCount
                : null,
          }));

          // Merge with previous stats to preserve user ratings if needed
          const mergedStats = mergeWithPrevStats(validatedStats);

          // Sort by track number for consistency
          const sortedStats = [...mergedStats].sort(
            (a, b) => a.trackNumber - b.trackNumber
          );

          // Update refs and state
          prevStatsRef.current = sortedStats;
          setStats(sortedStats);
          setError(null); // Clear error

          console.log(
            "Updated stats with user ratings:",
            sortedStats.map((s) => ({
              id: s.id,
              currentUserRating: s.currentUserRating,
            }))
          );
        } else {
          throw new Error("Invalid response format");
        }
      } catch (fetchError) {
        // If specific error with group/user filter, try falling back to public stats
        if (
          filters.groupId !== "all" ||
          filters.userId !== "all" ||
          filters.showUserOnly
        ) {
          try {
            // Fall back to public stats
            const publicResponse = await fetchWrapper(
              `/albums/${albumId}/songs/stats`,
              {
                headers: { "Content-Type": "application/json" },
              }
            );

            if (Array.isArray(publicResponse)) {
              const validatedStats = publicResponse.map((song) => ({
                ...song,
                averageRating:
                  typeof song.averageRating === "number"
                    ? song.averageRating
                    : 0,
                reviewCount:
                  typeof song.reviewCount === "number" ? song.reviewCount : 0,
                userRating:
                  typeof song.userRating === "number" ? song.userRating : null,
              }));

              // Apply any pending user ratings
              const mergedStats = mergeWithPrevStats(validatedStats);

              // Sort by track number for consistency
              const sortedStats = [...mergedStats].sort(
                (a, b) => a.trackNumber - b.trackNumber
              );

              prevStatsRef.current = sortedStats;
              setStats(sortedStats);
              setError(
                "Could not load filtered data. Showing public ratings instead."
              );
            } else {
              throw new Error("Invalid response format from public stats");
            }
          } catch (fallbackError) {
            throw fetchError; // Throw the original error if fallback fails
          }
        } else {
          throw fetchError;
        }
      }
    } catch (err) {
      console.error("Error fetching album stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load song statistics"
      );
    } finally {
      setLoading(false);
    }
  }, [
    albumId,
    filters,
    isAuthenticated,
    user,
    getAuthHeader,
    mergeWithPrevStats,
  ]);

  // Special effect to handle reviewUpdateCount changes
  useEffect(() => {
    if (reviewUpdateCount > 0) {
      console.log("Review update triggered - refreshing stats");
      fetchStats();
    }
  }, [reviewUpdateCount, fetchStats]);

  // Main effect to fetch stats when dependencies change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
    setUserRating, // Export this so ReviewsTable can use it
  };
};
