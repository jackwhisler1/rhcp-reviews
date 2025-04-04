import React, { useState, useEffect, useRef, useCallback } from "react";
import { SongStat, FiltersState, UserReview } from "../../types/rhcp-types";
import { Rating } from "react-simple-star-rating";
import { useAuth } from "../../context/AuthContext";
import { fetchWrapper } from "../../services/api";

interface TableProps {
  songStats: SongStat[];
  filters: FiltersState;
  albumId: number;
  onReviewSubmitted?: () => void;
}

// This is a completely different approach that focuses on stability over structure
const ReviewsTable = ({
  songStats,
  filters,
  albumId,
  onReviewSubmitted,
}: TableProps) => {
  const isGroupView = filters.groupId !== "all";
  const isUserView = filters.userId !== "all" || filters.showUserOnly;
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Keep all state in refs when possible to minimize re-renders
  const expandedSongIdRef = useRef<number | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

  const userReviewsRef = useRef<{ [key: number]: UserReview[] }>({});
  const [loadingReviews, setLoadingReviews] = useState<{
    [key: number]: boolean;
  }>({});

  // These states need to be reactive for UI but we'll update carefully
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

  // Debounce timeout references
  const commentTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Initialize ratings once from songStats
  useEffect(() => {
    const ratings: { [key: number]: number } = {};
    songStats.forEach((song) => {
      if (song.userRating !== undefined && song.userRating !== null) {
        ratings[song.id] = song.userRating;
      }
    });

    if (Object.keys(ratings).length > 0) {
      setCurrentRatings(ratings);
    }
  }, []);

  // Get auth headers helper
  const getAuthHeader = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return { headers };
  }, [user]);

  // Handle expanding/collapsing reviews
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

  // Rating change handler - CRITICAL for stability
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

  // Safe content change handler
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
      const songData = songStats.find((s) => s.id === songId);
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

  // Helper for date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm select-none">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            className="float-right text-red-700"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">
              #
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">
              Song
            </th>
            {!isUserView && (
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-900 w-24">
                Public Avg
              </th>
            )}
            {isGroupView && (
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-900 w-24">
                Group Avg
              </th>
            )}
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-900 w-32">
              Your Rating
            </th>
            {isAuthenticated && (
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">
                Your Comment
              </th>
            )}
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-900 w-32">
              All Reviews
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {songStats.map((song) => (
            <React.Fragment key={song.id}>
              <tr
                className={`hover:bg-gray-50 transition-colors ${
                  expandedSongId === song.id ? "bg-gray-50" : ""
                }`}
              >
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700">
                  {song.trackNumber}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900">
                  {song.title}
                </td>

                {!isUserView && (
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700 text-right">
                    {song.averageRating.toFixed(1)}
                  </td>
                )}

                {isGroupView && (
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700 text-right">
                    {(song.groupAverage || 0).toFixed(1)}
                  </td>
                )}

                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-700">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-center relative">
                      <Rating
                        onClick={(rate) => handleRatingChange(song.id, rate)}
                        initialValue={
                          (currentRatings[song.id] || song.userRating || 0) / 2
                        }
                        key={`rating-${song.id}-${
                          currentRatings[song.id] || song.userRating || 0
                        }`}
                        size={18}
                        allowFraction
                        iconsCount={5}
                        transition
                      />
                      {submitting[song.id] && (
                        <div className="absolute -right-6">
                          <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                        </div>
                      )}
                      {successMessages[song.id] && (
                        <div className="absolute right-0 -bottom-5 text-xs text-green-600 whitespace-nowrap">
                          {successMessages[song.id]}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      {song.userRating?.toFixed(1) || "-"}
                    </div>
                  )}
                </td>

                {isAuthenticated && (
                  <td className="px-3 py-2 text-sm">
                    <div className="relative">
                      <input
                        type="text"
                        value={reviewContents[song.id] || ""}
                        onChange={(e) =>
                          handleContentChange(song.id, e.target.value)
                        }
                        placeholder="Add comment (autosaves)"
                        className="w-full border-gray-300 rounded-sm text-sm p-1 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {editingComments[song.id] && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-pulse h-2 w-2 rounded-full bg-indigo-500"></div>
                        </div>
                      )}
                    </div>
                  </td>
                )}

                <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">
                  <button
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold shadow-sm ${
                      expandedSongId === song.id
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-white-smoke"
                    } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors`}
                    onClick={() => handleExpand(song.id)}
                  >
                    {expandedSongId === song.id
                      ? "Hide Reviews"
                      : `View Reviews (${song.reviewCount})`}
                  </button>
                </td>
              </tr>

              {/* Expanded review section */}
              {expandedSongId === song.id && (
                <tr>
                  <td
                    colSpan={isAuthenticated ? 7 : 6}
                    className="px-4 py-4 bg-gray-50"
                  >
                    <div className="border-t border-b border-gray-200 py-4">
                      {/* Reviews list */}
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        All Reviews ({song.reviewCount})
                      </h4>

                      {loadingReviews[song.id] ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : userReviewsRef.current[song.id]?.length > 0 ? (
                        <div className="space-y-4">
                          {userReviewsRef.current[song.id].map((review) => (
                            <div
                              key={review.id}
                              className="bg-white p-3 rounded border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <img
                                      className="h-8 w-8 rounded-full"
                                      src={"/images/default-avatar.jpg"}
                                      alt=""
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {review.username || "Anonymous"}
                                      {user && review.userId === user.id && (
                                        <span className="ml-2 text-xs font-normal text-gray-500">
                                          (You)
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(review.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Rating
                                    initialValue={review.rating / 2}
                                    size={16}
                                    readonly
                                    allowFraction
                                    iconsCount={5}
                                  />
                                  <span className="ml-1 text-sm font-medium">
                                    {review.rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>

                              {review.content && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <p>{review.content}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded border border-gray-200">
                          <p className="text-gray-500">
                            No reviews yet for this song.
                          </p>
                          {isAuthenticated && (
                            <p className="text-sm text-gray-500 mt-1">
                              Be the first to leave a review!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(ReviewsTable);
