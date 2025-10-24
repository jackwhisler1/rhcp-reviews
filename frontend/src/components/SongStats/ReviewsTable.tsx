import React, { useState, useCallback, useRef, useMemo } from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat, FiltersState, UserReview } from "../../types/rhcp-types";
import { useAuth } from "../../context/AuthContext";
import { fetchWrapper } from "../../services/api";
import ReviewItem from "./ReviewItem";
import ReviewRow from "./ReviewRow";

interface TableProps {
  songStats: SongStat[];
  filters: FiltersState;
  albumId: number;
  onReviewSubmitted?: (updatedSong?: SongStat) => void;
}

interface ReviewState {
  ratings: Record<number, number>;
  contents: Record<number, string>;
  submitting: Record<number, boolean>;
  reviews: Record<number, UserReview[]>;
  loading: Record<number, boolean>;
}

const ReviewsTable = ({
  songStats,
  filters,
  albumId,
  onReviewSubmitted,
}: TableProps) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [expandedSongIds, setExpandedSongIds] = useState<number[]>([]);
  const [reviews, setReviews] = useState<Record<number, UserReview[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ReviewState>({
    ratings: {},
    contents: {},
    submitting: {},
    reviews: {},
    loading: {},
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

  const currentRatings = useMemo(
    () =>
      songStats.reduce((acc, song) => {
        const inProgress = state.ratings[song.id];
        return {
          ...acc,
          [song.id]:
            inProgress ?? song.currentUserRating ?? song.groupAverage ?? 0,
        };
      }, {} as Record<number, number>),
    [songStats, state.ratings]
  );

  const updateReviewState = (updates: Partial<ReviewState>) => {
    setState((prev) => ({
      ...prev,
      ...Object.keys(updates).reduce(
        (acc, key) => ({
          ...acc,
          [key]: {
            ...prev[key as keyof ReviewState],
            ...updates[key as keyof ReviewState],
          },
        }),
        {}
      ),
    }));
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);

    if (!isEditMode) {
      // Expand ALL songs for editing
      const allSongIds = songStats.map((song) => song.id);

      // Fetch reviews for all songs
      allSongIds.forEach((songId) => {
        const song = songStats.find((s) => s.id === songId);

        // Find the current user's review for this song
        const currentUserReview = song?.userReviews?.find(
          (review) => review.userId === user?.id
        );

        updateReviewState({
          ratings: {
            [songId]: song?.currentUserRating ?? 0,
          },
          contents: {
            [songId]: currentUserReview?.content || "",
          },
        });
        handleExpand(songId);
      });
    } else {
      // When exiting edit mode, collapse all
      setExpandedSongId(null);
    }
  };
  const handleExpand = useCallback(
    async (songId: number) => {
      setExpandedSongIds(
        (prev) =>
          prev.includes(songId)
            ? prev.filter((id) => id !== songId) // collapse
            : [...prev, songId] // expand
      );
      // Optionally, trigger `loading`/fetch reviews only when expanding
      if (!state.reviews[songId]) {
        updateReviewState({ loading: { [songId]: true } });
        try {
          // fetch reviews
          const params = new URLSearchParams({
            songId: songId.toString(),
            ...(filters.groupId !== "all" && {
              groupId: filters.groupId,
              includeRatings: "true",
            }),
          });
          const response = await fetchWrapper(`/reviews/song?${params}`);
          updateReviewState({
            reviews: { [songId]: response.reviews },
            loading: { [songId]: false },
          });
        } catch (err) {
          updateReviewState({ loading: { [songId]: false } });
        }
      }
    },
    [filters.groupId, state.reviews]
  );
  const handleEditReview = useCallback(
    (songId: number) => {
      console.log("songId" + songId);
      // Find the current user's review for this song
      const song = songStats.find((s) => s.id === songId);
      const currentUserRating = song?.currentUserRating;
      const currentUserReviewContent = song?.currentUserReviewContent;
      // Update state with current user's review
      updateReviewState({
        ratings: {
          [songId]: currentUserRating ?? 0,
        },
        contents: {
          [songId]: currentUserReviewContent || "",
        },
      });

      // Set the expanded song ID
      setExpandedSongId(songId);
    },
    [songStats, user?.id]
  );
  const isCurrentUserSelected = filters.userId === String(user?.id);

  const contentsRef = useRef<Record<number, string>>({});

  const handleRatingChange = useCallback(
    async (songId: number, stars: number) => {
      const rating = stars * 2;
      const songData = songStats.find((s) => s.id === songId);
      // Immediate rating update
      updateReviewState({
        ratings: { [songId]: rating },
        submitting: { [songId]: true },
      });

      if (!songData) return;

      const isNewReview = !songData.currentUserReviewId;
      const tempReviewCount =
        songData.publicReviewCount + (isNewReview ? 1 : 0);

      // Optimistic update
      const content = contentsRef.current[songId] || "";

      setState((prev) => {
        const existingReviews = prev.reviews[songId] || [];
        const existingIndex = existingReviews.findIndex(
          (r) => r.userId === user?.id
        );

        const updatedReview = {
          ...(existingIndex >= 0 ? existingReviews[existingIndex] : {}),
          id: songData.currentUserReviewId || Date.now(), // Use real ID if available
          userId: user!.id,
          songId,
          rating: stars * 2,
          content: content,
          createdAt: new Date().toISOString(),
          author: {
            id: user!.id,
            username: user!.username,
            image: user!.image,
          },
        };

        return {
          ...prev,
          reviews: {
            ...prev.reviews,
            [songId]:
              existingIndex >= 0
                ? [
                    ...existingReviews.slice(0, existingIndex),
                    updatedReview,
                    ...existingReviews.slice(existingIndex + 1),
                  ]
                : [updatedReview, ...existingReviews],
          },
          ratings: {
            ...prev.ratings,
            [songId]: stars * 2, // Update rating immediately
          },
        };
      });

      onReviewSubmitted?.({
        ...songData,
        currentUserRating: rating,
        publicReviewCount: tempReviewCount,
        currentUserReviewId: songData.currentUserReviewId || Date.now(), // Temp ID
      });

      try {
        const method = songData.currentUserReviewId ? "PUT" : "POST";
        const payload: any = {
          songId,
          rating,
          content,
        };

        const response = await fetchWrapper(
          `/reviews/${songData?.currentUserReviewId || ""}`,
          {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );

        if (response.id) {
          setState((prev) => ({
            ...prev,
            reviews: {
              ...prev.reviews,
              [songId]: (prev.reviews[songId] || []).map((review) =>
                review.userId === user?.id
                  ? { ...review, id: response.id }
                  : review
              ),
            },
          }));
        }
        updateReviewState({
          contents: { [songId]: response.content },
          submitting: { [songId]: false },
        });
        // Final update with actual data
        onReviewSubmitted?.({
          ...songData,
          currentUserRating: rating,
          currentUserReviewId: response.id,
          publicReviewCount:
            songData.publicReviewCount + (method === "POST" ? 1 : 0),
        });
      } catch (err) {
        // Rollback
        onReviewSubmitted?.(songData);
      }
    },
    [songStats, onReviewSubmitted]
  );

  const getAuthHeaders = () => {
    const headers: { "Content-Type": string; Authorization?: string } = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return headers;
  };

  const handleContentChange = useCallback((songId: number, content: string) => {
    contentsRef.current = { ...contentsRef.current, [songId]: content };
    updateReviewState({ contents: { [songId]: content } });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const autoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "inherit";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm select-none">
      <div className="px-4 py-3 bg-gray-50 flex justify-end">
        {isAuthenticated && (
          <button
            onClick={toggleEditMode}
            className={`
    px-4 py-3 
    rounded-sm 
    text-white-smoke 
    font-semibold 
    transition-all 
    duration-300 
    ease-in-out 
    ${
      isEditMode
        ? "bg-blood-red hover:bg-cornell-red-2 "
        : "bg-night hover:bg-blood-red "
    }
    transform 
    hover:scale-105 
    active:scale-95 
    shadow-md 
    hover:shadow-lg 
  `}
          >
            {isEditMode ? "Save All Reviews" : "Edit Reviews"}
          </button>
        )}
      </div>
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

            {/* Public Avg */}

            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Public Avg
            </th>

            {/* Group Avg */}
            {filters.groupId !== "all" && (
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                Group Avg
              </th>
            )}

            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Your Rating
            </th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {songStats.map((song) => (
            <React.Fragment key={song.id}>
              <ReviewRow
                song={song}
                isGroupView={filters.groupId !== "all"}
                groupId={filters.groupId}
                isEditMode={isEditMode}
                isAuthenticated={isAuthenticated}
                isExpanded={expandedSongIds.includes(song.id)}
                currentRatings={currentRatings}
                submitting={state.submitting}
                handleExpand={handleExpand}
                handleRatingChange={handleRatingChange}
                filteredReviews={state.reviews[song.id] || []}
                userId={user?.id}
                handleEditReview={handleEditReview}
                handleViewReviews={handleExpand}
              />
              {expandedSongIds.includes(song.id) && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 bg-gray-50">
                    {state.loading[song.id] ? (
                      <div>Loading...</div>
                    ) : (
                      <div>
                        {/* Always show your review first (if present) */}
                        {[
                          ...state.reviews[song.id].filter(
                            (r) => r.userId === user?.id
                          ),
                          ...state.reviews[song.id].filter(
                            (r) => r.userId !== user?.id
                          ),
                        ].map((review) => (
                          <ReviewItem
                            key={review.id}
                            review={review}
                            isCurrentUser={user?.id === review.userId}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
              {isEditMode && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 bg-gray-50">
                    <div className="border-t border-gray-200 py-4">
                      {isAuthenticated && (
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
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
                                  (currentRatings[song.id] || 0) / 2
                                }
                                size={24}
                                allowFraction
                                iconsCount={5}
                              />
                              <span className="ml-2 text-gray-700">
                                {currentRatings[song.id]?.toFixed(1) || "0.0"}
                                /10
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Comments
                            </label>
                            <textarea
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              rows={3}
                              maxLength={500}
                              value={state.contents[song.id] || ""}
                              onChange={(e) => {
                                handleContentChange(song.id, e.target.value);
                                autoExpand(e);
                              }}
                              placeholder="Share your thoughts..."
                            />{" "}
                            <div className="text-right text-xs text-gray-500 mt-1">
                              {state.contents[song.id]?.length || 0}/500
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <form onSubmit={(e) => e.preventDefault()}>
                              <button
                                type="button"
                                className={`bg-indigo-600 text-white px-4 py-2 rounded-md ${
                                  state.submitting[song.id]
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleRatingChange(
                                    song.id,
                                    (currentRatings[song.id] || 0) / 2
                                  )
                                }
                                disabled={state.submitting[song.id]}
                              >
                                {state.submitting[song.id]
                                  ? "Saving..."
                                  : "Save Review"}
                              </button>
                            </form>
                          </div>
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
