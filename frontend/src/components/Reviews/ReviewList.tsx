import React, { useState, useCallback } from "react";
import { useReviews } from "../../hooks/useReviews";
import { Review, ReviewFilters } from "../../types/review";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { ReviewItem } from "./ReviewItem";
import { ReviewForm } from "./ReviewForm";
import { ReviewFilterControls } from "./ReviewFilterControls";
import LoadingSpinner from "../common/LoadingSpinner";
import { ErrorDisplay } from "../common/ErrorDisplay";

interface ReviewListProps {
  songId?: number;
  albumId?: number;
  initialFilters?: ReviewFilters;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  songId,
  albumId,
  initialFilters,
}) => {
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

  const {
    reviews,
    loading,
    error,
    pagination,
    addReview,
    updateReview,
    deleteReview,
    loadMore,
    setFilters,
    refreshReviews,
  } = useReviews({
    songId,
    albumId,
    initialFilters,
  });

  const [editingReview, setEditingReview] = useState<Partial<Review> | null>(
    null
  );

  // Group reviews by song
  const reviewsBySong = reviews.reduce(
    (acc, review) => {
      if (review.song) {
        const songId = review.song.id;
        if (!acc[songId]) {
          acc[songId] = {
            songId,
            songTitle: review.song.title,
            trackNumber: review.song.trackNumber,
            reviews: [],
          };
        }
        acc[songId].reviews.push(review);
      }
      return acc;
    },
    {} as Record<
      number,
      {
        songId: number;
        songTitle: string;
        trackNumber: number;
        reviews: Review[];
      }
    >
  );

  const toggleSongExpansion = useCallback((songId: number) => {
    setExpandedSongId((prev) => (prev === songId ? null : songId));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="review-list space-y-4">
      <ReviewFilterControls onFilterChange={setFilters} />

      <ReviewForm
        initialReview={editingReview}
        onSubmit={async (reviewData) => {
          try {
            if (editingReview && "id" in editingReview) {
              await updateReview(editingReview.id!, reviewData);
            } else {
              await addReview(reviewData);
            }
            setEditingReview(null);
          } catch (error) {
            console.error("Review submission failed", error);
          }
        }}
        onCancel={() => setEditingReview(null)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Track</th>
              <th className="p-2">Song</th>
              <th className="p-2">Total Reviews</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(reviewsBySong).map((songReviews) => (
              <React.Fragment key={songReviews.songId}>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2">{songReviews.trackNumber}</td>
                  <td className="p-2">{songReviews.songTitle}</td>
                  <td className="p-2">{songReviews.reviews.length}</td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleSongExpansion(songReviews.songId)}
                      className="flex items-center text-blue-500 hover:text-blue-700"
                    >
                      {expandedSongId === songReviews.songId ? (
                        <>
                          Hide Reviews
                          <ChevronUpIcon className="ml-1 h-5 w-5" />
                        </>
                      ) : (
                        <>
                          View Reviews
                          <ChevronDownIcon className="ml-1 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                {expandedSongId === songReviews.songId && (
                  <tr>
                    <td colSpan={4} className="p-4 bg-gray-50">
                      <div className="space-y-2">
                        {songReviews.reviews.map((review) => (
                          <ReviewItem
                            key={review.id}
                            review={review}
                            onEdit={() => setEditingReview(review)}
                            onDelete={() => deleteReview(review.id)}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.page < pagination.totalPages && (
        <div className="text-center">
          <button
            onClick={loadMore}
            className="flex items-center mx-auto bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Load More Reviews
            <ChevronDownIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
