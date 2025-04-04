import React, { useState, useEffect } from "react";
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

const ReviewsTable = ({
  songStats,
  filters,
  albumId,
  onReviewSubmitted,
}: TableProps) => {
  const isGroupView = filters.groupId !== "all";
  const isUserView = filters.userId !== "all" || filters.showUserOnly;
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);
  const [userReviews, setUserReviews] = useState<{
    [key: number]: UserReview[];
  }>({});
  const [reviewsLoading, setReviewsLoading] = useState<{
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
  useEffect(() => {
    const initialRatings: { [key: number]: number } = {};

    songStats.forEach((song) => {
      if (song.userRating !== undefined && song.userRating !== null) {
        initialRatings[song.id] = song.userRating;
      }
    });

    if (Object.keys(initialRatings).length > 0) {
      setCurrentRatings((prev) => ({
        ...prev,
        ...initialRatings,
      }));
    }
  }, [songStats]);

  // Update currentRatings when songStats change (to reflect updated ratings)
  useEffect(() => {
    const newRatings = { ...currentRatings };
    let hasChanges = false;

    songStats.forEach((song) => {
      if (song.userRating && song.userRating !== currentRatings[song.id]) {
        newRatings[song.id] = song.userRating;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setCurrentRatings(newRatings);
    }
  }, [songStats]);

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return { headers };
  };

  const handleExpand = async (songId: number) => {
    if (expandedSongId === songId) {
      setExpandedSongId(null);
      return;
    }

    setExpandedSongId(songId);

    if (!userReviews[songId]) {
      setReviewsLoading({ ...reviewsLoading, [songId]: true });
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

        setUserReviews({
          ...userReviews,
          [songId]: response.reviews || [],
        });

        // Find user's review if it exists
        if (isAuthenticated && user) {
          const userReview = response.reviews?.find(
            (review: UserReview) => review.userId === user.id
          );

          if (userReview) {
            setCurrentRatings({
              ...currentRatings,
              [songId]: userReview.rating,
            });
            setReviewContents({
              ...reviewContents,
              [songId]: userReview.content || "",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setReviewsLoading({ ...reviewsLoading, [songId]: false });
      }
    }
  };

  const handleRatingChange = (songId: number, rating: number) => {
    setCurrentRatings({ ...currentRatings, [songId]: rating * 2 }); // Convert 5-star scale to 10-point scale
  };

  const handleContentChange = (songId: number, content: string) => {
    setReviewContents({ ...reviewContents, [songId]: content });
  };

  const handleSubmitReview = async (songId: number) => {
    if (!isAuthenticated || !user) {
      setError("You must be logged in to submit a review");
      return;
    }

    setSubmitting({ ...submitting, [songId]: true });

    try {
      // Find this song in the songStats to check if user already has a review
      const songData = songStats.find((song) => song.id === songId);
      const hasExistingReview =
        songData?.userRating !== undefined && songData?.userRating !== null;
      const rating = currentRatings[songId] || 0;

      if (rating === 0) {
        throw new Error("Please provide a rating");
      }

      const reviewData = {
        songId,
        rating,
        content: reviewContents[songId] || "",
        groupId: filters.groupId !== "all" ? parseInt(filters.groupId) : null,
      };

      // Find the review ID if we're updating
      let reviewId = null;
      if (hasExistingReview && userReviews[songId]) {
        const existingReview = userReviews[songId].find(
          (review) => review.userId === user.id
        );
        if (existingReview) {
          reviewId = existingReview.id;
        }
      }

      // Determine endpoint and method based on whether we're updating
      const method = reviewId ? "PUT" : "POST";
      const endpoint = reviewId ? `/reviews/${reviewId}` : "/reviews";

      console.log(`Submitting review: ${method} ${endpoint}`, reviewData);

      const options = {
        ...getAuthHeader(),
        method,
        body: JSON.stringify(reviewData),
      };

      // Make the API request
      const response = await fetchWrapper(endpoint, options);
      console.log("Review submission response:", response);

      // Update the local state with the new/updated review
      if (response && response.id) {
        // Call the onReviewSubmitted callback to refresh song stats
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }

        // Refresh the reviews for this song
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

        setUserReviews({
          ...userReviews,
          [songId]: reviewsResponse.reviews || [],
        });
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting({ ...submitting, [songId]: false });
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
                    <div className="flex justify-end items-center">
                      <Rating
                        onClick={(rate) => handleRatingChange(song.id, rate)}
                        initialValue={(song.userRating || 0) / 2}
                        size={20}
                        allowFraction
                        iconsCount={5}
                        transition
                      />
                      <span className="ml-2 text-gray-700">
                        {(currentRatings[song.id] !== undefined
                          ? currentRatings[song.id]
                          : song.userRating !== undefined &&
                            song.userRating !== null
                          ? song.userRating
                          : 0
                        ).toFixed(1)}
                      </span>
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
                              onClick={() => handleSubmitReview(song.id)}
                              disabled={
                                submitting[song.id] ||
                                currentRatings[song.id] === 0
                              }
                            >
                              {submitting[song.id]
                                ? "Submitting..."
                                : song.userRating !== undefined &&
                                  song.userRating !== null
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

                      {reviewsLoading[song.id] ? (
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

export default ReviewsTable;
