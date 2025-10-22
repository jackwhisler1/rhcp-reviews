import React, { useMemo, useState } from "react";
import { SongStat, UserReview } from "../../types/rhcp-types";
import RatingComponent from "./RatingComponent";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

interface ReviewRowProps {
  song: SongStat;
  isGroupView: boolean;
  groupId?: string;
  isAuthenticated: boolean;
  isEditMode: boolean;
  expandedSongId: number | null;
  currentRatings: { [key: number]: number };
  submitting: { [key: number]: boolean };
  handleExpand: (songId: number) => void;
  handleRatingChange: (songId: number, rating: number) => void;
  filteredReviews: UserReview[];
  userId?: Number;
  handleEditReview: (songId: number) => void;
  handleViewReviews: (songId: number) => void;
}

const ReviewRow: React.FC<ReviewRowProps> = ({
  song,
  isGroupView,
  groupId,
  isAuthenticated,
  isEditMode,
  expandedSongId,
  currentRatings,
  submitting,
  handleRatingChange,
  filteredReviews,
  userId,
  handleEditReview,
  handleViewReviews,
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
        <RatingComponent
          value={song.publicAverage}
          onSubmit={(stars: number) => handleRatingChange(song.id, stars)}
          isSubmitting={true}
        />
      </td>

      {/* Group Avg or empty cell */}
      {isGroupView && (
        <RatingComponent
          value={song.groupAverage}
          onSubmit={(stars: number) => handleRatingChange(song.id, stars)}
          isSubmitting={true}
        />
      )}

      {/* Your Rating */}
      <td className="px-2 py-2 text-sm text-right">
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
      <td className="px-3 py-2 text-right relative">
        <div className="flex gap-2 justify-end items-center">
          {/* Edit Review Button (always visible when not in edit mode) */}
          {isAuthenticated && !isEditMode && (
            <button
              className="text-gray-600 hover:text-gray-900"
              onClick={() => handleEditReview(song.id)}
              title="Edit Review"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}

          {/* Reviews Button (always visible if there are other reviews) */}
          {otherReviewsCount > 0 && (
            <button
              className="bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 text-sm flex items-center"
              onClick={() => handleViewReviews(song.id)}
            >
              Reviews ({otherReviewsCount})
              {expandedSongId === song.id ? (
                <ChevronUpIcon className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default React.memo(ReviewRow);
