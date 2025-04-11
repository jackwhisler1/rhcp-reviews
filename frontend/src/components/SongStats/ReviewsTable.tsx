import React, { useState, useCallback, useRef } from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat, FiltersState, UserReview } from "../../types/rhcp-types";
import { useAuth } from "../../context/AuthContext";
import { fetchWrapper } from "../../services/api";

interface TableProps {
  songStats: SongStat[];
  filters: FiltersState;
  albumId: number;
  onReviewSubmitted?: () => void;
}

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

  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);
  const [userReviews, setUserReviews] = useState<{
    [key: number]: UserReview[];
  }>({});
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
  const [error, setError] = useState<string | null>(null);

  // Keep a reference of the last rating change to ensure it's used in submit
  const pendingRatingRef = useRef<{ songId: number; rating: number } | null>(
    null
  );

  // Initialize ratings from songStats when they change
  React.useEffect(() => {
    const newRatings: { [key: number]: number } = {};
    songStats.forEach((song) => {
      if (song.userRating) {
        newRatings[song.id] = song.userRating;
      }
    });
    setCurrentRatings((prev) => ({ ...prev, ...newRatings }));
  }, [songStats]);

  const handleExpand = async (songId: number) => {
    if (expandedSongId === songId) {
      setExpandedSongId(null);
      return;
    }

    setExpandedSongId(songId);

    if (!userReviews[songId]) {
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
          { headers: getAuthHeaders() }
        );

        setUserReviews((prev) => ({
          ...prev,
          [songId]: response.reviews || [],
        }));

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
      } finally {
        setLoadingReviews((prev) => ({ ...prev, [songId]: false }));
      }
    }
  };

  const getAuthHeaders = () => {
    const headers: { "Content-Type": string; Authorization?: string } = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return headers;
  };

  const handleRatingChange = (songId: number, rating: number) => {
    // Convert 5-star scale to 10-point scale
    const newRating = rating * 2;
    console.log(
      `Rating changed for song ${songId}: ${rating} stars = ${newRating}/10`
    );

    // Store the rating in state
    setCurrentRatings((prev) => ({
      ...prev,
      [songId]: newRating,
    }));

    // Save the rating in ref to ensure it's used in submit
    pendingRatingRef.current = { songId, rating: newRating };

    // Submit the review with the new rating
    handleSubmitReview(songId, newRating);
  };

  const handleContentChange = (songId: number, content: string) => {
    setReviewContents((prev) => ({
      ...prev,
      [songId]: content,
    }));
  };

  // Allow explicit submission with the current rating
  const handleSubmitClick = (songId: number) => {
    const rating = currentRatings[songId] || 0;
    handleSubmitReview(songId, rating);
  };

  // Handle review submission with explicit rating parameter
  const handleSubmitReview = async (songId: number, ratingToSubmit: number) => {
    if (!isAuthenticated || !user) {
      setError("You must be logged in to submit a review");
      return;
    }

    // Check if we have a valid rating to submit
    if (!ratingToSubmit || ratingToSubmit <= 0) {
      setError("Please provide a rating");
      return;
    }

    console.log(
      `Submitting review for song ${songId} with rating ${ratingToSubmit}/10`
    );
    setSubmitting((prev) => ({ ...prev, [songId]: true }));

    try {
      const reviewData = {
        songId,
        rating: ratingToSubmit,
        content: reviewContents[songId] || "",
        groupId: filters.groupId !== "all" ? parseInt(filters.groupId) : null,
      };

      console.log("Review data to submit:", reviewData);

      // Find review ID if updating
      let reviewId = null;
      let hasExistingReview = false;

      // First check songStats for an existing user rating
      const songData = songStats.find((s) => s.id === songId);
      hasExistingReview =
        songData?.userRating !== undefined && songData.userRating !== null;

      // Then check userReviews if we have them loaded
      if (userReviews[songId]) {
        const existingReview = userReviews[songId].find(
          (review) => review.userId === user.id
        );
        if (existingReview) {
          reviewId = existingReview.id;
          hasExistingReview = true;
        }
      }

      // Determine endpoint and method
      const method = reviewId ? "PUT" : "POST";
      const endpoint = reviewId ? `/reviews/${reviewId}` : "/reviews";

      console.log(`Submitting review: ${method} ${endpoint}`, {
        reviewData,
        reviewId,
        hasExistingReview,
      });

      // Use fetchWrapper which handles API_BASE correctly
      const response = await fetchWrapper(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      });

      console.log("Review submission response:", response);

      // Ensure the current ratings state is updated with the submitted value
      setCurrentRatings((prev) => ({
        ...prev,
        [songId]: ratingToSubmit,
      }));

      // Update local reviews if needed
      if (expandedSongId === songId) {
        const queryParams = new URLSearchParams({
          songId: songId.toString(),
        });

        if (filters.groupId !== "all") {
          queryParams.append("groupId", filters.groupId);
        }

        const reviewsResponse = await fetchWrapper(
          `/reviews/song?${queryParams.toString()}`,
          { headers: getAuthHeaders() }
        );

        setUserReviews((prev) => ({
          ...prev,
          [songId]: reviewsResponse.reviews || [],
        }));
      }

      // Call the callback to refresh the stats
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting((prev) => ({ ...prev, [songId]: false }));
      // Clear the pending rating ref
      if (pendingRatingRef.current?.songId === songId) {
        pendingRatingRef.current = null;
      }
    }
  };

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
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
              #
            </th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
              Song
            </th>
            {!isUserView && (
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                Public Avg
              </th>
            )}
            {isGroupView && (
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                Group Avg
              </th>
            )}
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              {isUserView ? "Your Rating" : "Selected User"}
            </th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Actions
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
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                  {song.trackNumber}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                  {song.title}
                </td>

                {!isUserView && (
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 text-right">
                    {song.averageRating.toFixed(1)}
                  </td>
                )}

                {isGroupView && (
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 text-right">
                    {(song.groupAverage || 0).toFixed(1)}
                  </td>
                )}

                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 text-right">
                  {isAuthenticated ? (
                    <div className="flex justify-end">
                      <Rating
                        onClick={(rate) => handleRatingChange(song.id, rate)}
                        initialValue={
                          (currentRatings[song.id] || song.userRating || 0) / 2
                        }
                        size={20}
                        allowFraction
                        iconsCount={5}
                        transition
                      />
                      {submitting[song.id] && (
                        <span className="ml-2 text-xs text-gray-500">
                          Saving...
                        </span>
                      )}
                    </div>
                  ) : (
                    song.userRating?.toFixed(1) || "-"
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                  <button
                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
                      expandedSongId === song.id
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-white-smoke hover:bg-gray-100"
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
                  <td colSpan={6} className="px-4 py-4 bg-gray-50">
                    <div className="border-t border-b border-gray-200 py-4">
                      {/* User review input section */}
                      {isAuthenticated && (
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                          <h4 className="text-lg font-medium text-gray-900 mb-3">
                            Your Review
                          </h4>

                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rating
                            </label>
                            <div className="flex items-center">
                              <Rating
                                onClick={(rate) =>
                                  handleRatingChange(song.id, rate)
                                }
                                initialValue={
                                  (currentRatings[song.id] ||
                                    song.userRating ||
                                    0) / 2
                                }
                                size={24}
                                allowFraction
                                iconsCount={5}
                                transition
                                fillColorArray={[
                                  "#f17a45", // 1-2 stars
                                  "#f19745", // 2-3 stars
                                  "#f1a545", // 3-4 stars
                                  "#f1b345", // 4-5 stars
                                  "#f1d045", // 5 stars
                                ]}
                              />
                              <span className="ml-2 text-gray-700">
                                {currentRatings[song.id]?.toFixed(1) ||
                                  song.userRating?.toFixed(1) ||
                                  "0.0"}
                                /10
                              </span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Comments (Optional)
                            </label>
                            <textarea
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              rows={3}
                              value={reviewContents[song.id] || ""}
                              onChange={(e) =>
                                handleContentChange(song.id, e.target.value)
                              }
                              placeholder="Share your thoughts about this song..."
                            ></textarea>
                          </div>

                          <div className="flex justify-end">
                            <button
                              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                submitting[song.id]
                                  ? "opacity-75 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() => handleSubmitClick(song.id)}
                              disabled={submitting[song.id]}
                            >
                              {submitting[song.id]
                                ? "Submitting..."
                                : currentRatings[song.id] || song.userRating
                                ? "Update Review"
                                : "Submit Review"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Reviews list */}
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        All Reviews ({song.reviewCount})
                      </h4>

                      {loadingReviews[song.id] ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : userReviews[song.id]?.length > 0 ? (
                        <div className="space-y-4">
                          {userReviews[song.id].map((review) => (
                            <div
                              key={review.id}
                              className="bg-white p-3 rounded border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <img
                                      className="h-8 w-8 rounded-full"
                                      src={"/images/default-user.png"}
                                      alt=""
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {review.author?.username || "Anonymous"}
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

export default ReviewsTable;
