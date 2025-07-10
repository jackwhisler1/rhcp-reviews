// ReviewRow.tsx
import React, { useMemo } from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat, UserReview } from "../../types/rhcp-types";
import RatingComponent from "./RatingComponent";

interface ReviewRowProps {
  song: SongStat;
  isGroupView: boolean;
  groupId?: string;
  isAuthenticated: boolean;
  expandedSongId: number | null;
  currentRatings: { [key: number]: number };
  submitting: { [key: number]: boolean };
  handleExpand: (songId: number) => void;
  handleRatingChange: (songId: number, rating: number) => void;
  filteredReviews: UserReview[];
  userId?: Number;
}

const ReviewRow: React.FC<ReviewRowProps> = ({
  song,
  isGroupView,
  groupId,
  isAuthenticated,
  expandedSongId,
  currentRatings,
  submitting,
  handleExpand,
  handleRatingChange,
  filteredReviews,
  userId,
}) => {
  const hasUserReview = useMemo(() => {
    if (!isGroupView)
      return filteredReviews.some((review) => review.userId === userId);

    return filteredReviews.some(
      (review) =>
        review.userId === userId && review.groupId === parseInt(groupId || "0")
    );
  }, [filteredReviews, userId, groupId, isGroupView]);

  const otherReviewsCount = useMemo(() => {
    if (!isGroupView) return filteredReviews.length - (hasUserReview ? 1 : 0);

    return filteredReviews.filter(
      (review) =>
        review.groupId === parseInt(groupId || "0") && review.userId !== userId
    ).length;
  }, [filteredReviews, userId, groupId, isGroupView, hasUserReview]);

  return (
    <tr
      className={`hover:bg-gray-50 ${
        expandedSongId === song.id ? "bg-gray-50" : ""
      }`}
    >
      <td className="px-3 py-2 text-sm">{song.trackNumber}</td>
      <td className="px-3 py-2 text-sm font-medium">{song.title}</td>

      {/* Public Avg */}

      <td className="px-3 py-2 text-sm text-right">
        {song.publicAverage.toFixed(1)}
      </td>

      {/* Group Avg or empty cell */}
      {isGroupView ? (
        <td className="px-3 py-2 text-sm text-right">
          {(song.groupAverage || 0).toFixed(1)}
        </td>
      ) : (
        <td className="px-3 py-2 text-sm text-right"></td>
      )}

      {/* Your Rating */}
      <td className="px-2 py-2 text-sm">
        {isAuthenticated ? (
          <RatingComponent
            value={currentRatings[song.id]}
            onSubmit={(stars: number) => handleRatingChange(song.id, stars)}
            isSubmitting={submitting[song.id]}
          />
        ) : (
          <div>{song.currentUserRating?.toFixed(1) || "-"}</div>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-2 text-right">
        <div className="flex gap-2 justify-end">
          <button
            className={`rounded-md px-3 py-2 text-sm ${
              expandedSongId === song.id
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => handleExpand(song.id)}
          >
            {hasUserReview ? "Edit Your Review" : "Add Review"}
          </button>

          {otherReviewsCount > 0 && (
            <button
              className="bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 text-sm"
              onClick={() => handleExpand(song.id)}
            >
              {`Read Reviews (${otherReviewsCount})`}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default React.memo(ReviewRow);
