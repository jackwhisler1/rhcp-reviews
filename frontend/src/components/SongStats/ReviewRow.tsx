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
  isExpanded: boolean;
  reviewsVisible?: boolean;
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
  reviewsVisible,
  currentRatings,
  isExpanded,
  submitting,
  handleRatingChange,
  filteredReviews,
  userId,
  handleEditReview,
  handleExpand,
}) => {
  const otherReviewsCount = useMemo(() => {
    return song.publicReviewCount || 0;
  }, [song.publicReviewCount]);

  return (
    <tr className={`hover:bg-gray-50 ${isExpanded ? "bg-gray-50" : ""}`}>
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
              className="text-gray-800 hover:text-gray-900"
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
              onClick={() => handleExpand(song.id)}
            >
              Reviews ({otherReviewsCount})
              {reviewsVisible ? (
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
