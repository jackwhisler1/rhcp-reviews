import { useState, useEffect, useRef, useCallback } from "react";
import { SongStat, FiltersState, UserReview } from "../types/rhcp-types";
import { fetchWrapper } from "../services/api";

interface User {
  id: number;
  token?: string;
  username?: string;
  email?: string;
}

export const useReviewsManager = (
  songStats: SongStat[],
  filters: FiltersState,
  user: User | null | undefined,
  onReviewSubmitted?: () => void
) => {
  const isAuthenticated = !!user;

  // State management
  const expandedSongIdRef = useRef<number | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

  const userReviewsRef = useRef<{ [key: number]: UserReview[] }>({});
  const [loadingReviews, setLoadingReviews] = useState<{
    [key: number]: boolean;
  }>({});

  const [currentRatings, setCurrentRatings] = useState<{
    [key: number]: number;
  }>({});
  const [reviewContents, setReviewContents] = useState<{
    [key: number]: string;
  }>({});
  const [submitting, setSubmitting] = useState<{ [key: number]: boolean }>({});
  const [successMessages, setSuccessMessages] = useState<{
    [key: number]: string;
  }>({});
  const [editingComments, setEditingComments] = useState<{
    [key: number]: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);

  const commentTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Initialize ratings from songStats
  useEffect(() => {
    const ratings: { [key: number]: number } = {};

    songStats.forEach((song: SongStat) => {
      if (song.userRating !== undefined && song.userRating !== null) {
        ratings[song.id] = song.userRating;
      }
    });

    if (Object.keys(ratings).length > 0) {
      setCurrentRatings(ratings);
    }
  }, [songStats]);

  // Load user reviews for all songs on component mount
  useEffect(() => {
    const loadUserReviews = async () => {
      if (!isAuthenticated || !user || !songStats.length) return;

      try {
        const songIds = songStats.map((song: SongStat) => song.id).join(",");
        const queryParams = new URLSearchParams({
          userId: user.id.toString(),
          songIds: songIds,
        });

        const response = await fetchWrapper(
          `/reviews/user/songs?${queryParams.toString()}`,
          getAuthHeader()
        );

        if (response && response.reviews && Array.isArray(response.reviews)) {
          const newRatings = { ...currentRatings };
          const newContents = { ...reviewContents };

          response.reviews.forEach((review: UserReview) => {
            newRatings[review.songId] = review.rating;
            newContents[review.songId] = review.content || "";
          });

          setCurrentRatings(newRatings);
          setReviewContents(newContents);
        }
      } catch (err) {
        console.error("Error fetching user reviews:", err);
      }
    };

    loadUserReviews();
  }, [songStats, user, isAuthenticated]);

  // Auth headers helper
  const getAuthHeader = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return { headers };
  }, [user]);

  // Handlers
  const handleExpand = useCallback(
    async (songId: number) => {
      if (expandedSongIdRef.current === songId) {
        expandedSongIdRef.current = null;
        setExpandedSongId(null);
        return;
      }

      expandedSongIdRef.current = songId;
      setExpandedSongId(songId);

      if (!userReviewsRef.current[songId]) {
        setLoadingReviews((prev) => ({ ...prev, [songId]: true }));

        try {
          const queryParams = new URLSearchParams({
            songId: songId.toString(),
          });

          if (filters.groupId !== "all") {
            queryParams.append("groupId", filters.groupId);
          }

          const response = await fetchWrapper(
            `/reviews/song?${queryParams.toString()}`,
            getAuthHeader()
          );

          userReviewsRef.current[songId] = response.reviews || [];

          // Force update so the component rerenders with reviews
          setLoadingReviews((prev) => ({ ...prev, [songId]: false }));

          // Find user's review if it exists
          if (isAuthenticated && user) {
            const userReview = response.reviews?.find(
              (review: UserReview) => review.userId === user.id
            );

            if (userReview) {
              setCurrentRatings((prev) => ({
                ...prev,
                [songId]: userReview.rating,
              }));
              setReviewContents((prev) => ({
                ...prev,
                [songId]: userReview.content || "",
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching reviews:", err);
          setError("Failed to load reviews");
          setLoadingReviews((prev) => ({ ...prev, [songId]: false }));
        }
      }
    },
    [filters, isAuthenticated, user, getAuthHeader]
  );

  const handleRatingChange = useCallback(
    (songId: number, rating: number) => {
      const newRating = rating * 2; // Convert 5-star scale to 10-point scale

      // Update state without causing a complete re-render
      setCurrentRatings((prev) => {
        const updatedRatings = { ...prev };
        updatedRatings[songId] = newRating;
        return updatedRatings;
      });

      // Submit the review in the background
      submitReview(songId, newRating, reviewContents[songId] || "");
    },
    [reviewContents]
  );

  const handleContentChange = useCallback(
    (songId: number, content: string) => {
      setReviewContents((prev) => ({ ...prev, [songId]: content }));
      setEditingComments((prev) => ({ ...prev, [songId]: true }));

      // Clear any existing timeout
      if (commentTimeouts.current[songId]) {
        clearTimeout(commentTimeouts.current[songId]);
      }

      // Set a new timeout to submit after 1.5 seconds of inactivity
      commentTimeouts.current[songId] = setTimeout(() => {
        const rating = currentRatings[songId];
        if (rating) {
          submitReview(songId, rating, content);
          setEditingComments((prev) => ({ ...prev, [songId]: false }));
        }
      }, 1500);
    },
    [currentRatings]
  );

  const submitReview = async (
    songId: number,
    rating: number,
    content: string
  ) => {
    if (!isAuthenticated || !user) {
      setError("You must be logged in to submit a review");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [songId]: true }));

    try {
      // Find if user already has a review
      const songData = songStats.find((s: SongStat) => s.id === songId);
      const hasExistingReview =
        songData?.userRating !== undefined && songData.userRating !== null;

      if (rating === 0) {
        throw new Error("Please provide a rating");
      }

      const reviewData = {
        songId,
        rating,
        content: content || "",
        groupId: filters.groupId !== "all" ? parseInt(filters.groupId) : null,
      };

      // Find review ID if updating
      let reviewId = null;

      // If we have an existing review based on userRating
      if (hasExistingReview) {
        // First check our cached reviews
        if (userReviewsRef.current[songId]) {
          const cachedReview = userReviewsRef.current[songId].find(
            (review) => review.userId === user.id
          );
          if (cachedReview) {
            reviewId = cachedReview.id;
          }
        }

        // If not found in cache, fetch it directly
        if (!reviewId) {
          try {
            console.log("Fetching review ID for:", songId);

            const response = await fetchWrapper(
              `/reviews/user/${user.id}/song/${songId}`,
              getAuthHeader()
            );

            if (response && response.review) {
              reviewId = response.review.id;
              console.log("Found review ID:", reviewId);

              // Update our cache with this review
              if (!userReviewsRef.current[songId]) {
                userReviewsRef.current[songId] = [];
              }

              // Only add if not already in the cache
              const exists = userReviewsRef.current[songId].some(
                (r) => r.id === response.review.id
              );
              if (!exists) {
                userReviewsRef.current[songId].push(response.review);
              }
            }
          } catch (err) {
            console.error("Error fetching review ID:", err);
            // Continue without the review ID - we'll create a new one
          }
        }
      }

      // Determine endpoint and method
      const method = reviewId ? "PUT" : "POST";
      const endpoint = reviewId ? `/reviews/${reviewId}` : "/reviews";

      console.log(`Submitting review: ${method} ${endpoint}`, {
        songId,
        reviewId,
        hasExistingReview,
      });

      const options = {
        ...getAuthHeader(),
        method,
        body: JSON.stringify(reviewData),
      };

      // Make the API request
      const response = await fetchWrapper(endpoint, options);

      // Show success message
      setSuccessMessages((prev) => ({
        ...prev,
        [songId]: hasExistingReview ? "Review updated!" : "Review submitted!",
      }));

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccessMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[songId];
          return newMessages;
        });
      }, 2000);

      // Maybe refresh stats or reviews if expanded
      if (response && response.id) {
        // Update our cache with this new/updated review
        if (response.id && !reviewId) {
          // This was a new review - store it
          if (!userReviewsRef.current[songId]) {
            userReviewsRef.current[songId] = [];
          }

          // Add or update the review in our cache
          const reviewIndex = userReviewsRef.current[songId].findIndex(
            (r) => r.id === response.id
          );
          if (reviewIndex >= 0) {
            userReviewsRef.current[songId][reviewIndex] = response;
          } else {
            userReviewsRef.current[songId].push(response);
          }
        }

        // Call the callback to refresh stats
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }

        // Only refresh expanded reviews
        if (expandedSongIdRef.current === songId) {
          const queryParams = new URLSearchParams({
            songId: songId.toString(),
          });

          if (filters.groupId !== "all") {
            queryParams.append("groupId", filters.groupId);
          }

          const reviewsResponse = await fetchWrapper(
            `/reviews/song?${queryParams.toString()}`,
            getAuthHeader()
          );

          userReviewsRef.current[songId] = reviewsResponse.reviews || [];
          // Force re-render for the reviews list
          setSubmitting((prev) => ({ ...prev }));
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting((prev) => ({ ...prev, [songId]: false }));
    }
  };

  return {
    expandedSongId,
    userReviewsRef,
    loadingReviews,
    currentRatings,
    reviewContents,
    submitting,
    successMessages,
    editingComments,
    error,
    setError,
    handleExpand,
    handleRatingChange,
    handleContentChange,
  };
};
