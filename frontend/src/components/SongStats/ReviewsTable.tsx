// ReviewsTable.tsx (main component)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SongStat, FiltersState, UserReview } from "../../types/rhcp-types";
import ReviewRow from "./ReviewRow";
import ExpandedReviewSection from "./ExpandedReviewSection";
import { useAuth } from "../../context/AuthContext";
import { fetchWrapper } from "../../services/api";
import { useReviewsManager } from "../../hooks/useReviewsManager";

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
  const [error, setError] = useState<string | null>(null);

  // Use a custom hook to manage review state and operations
  const {
    expandedSongId,
    userReviewsRef,
    loadingReviews,
    currentRatings,
    reviewContents,
    submitting,
    successMessages,
    editingComments,
    handleExpand,
    handleRatingChange,
    handleContentChange,
  } = useReviewsManager(songStats, filters, user, onReviewSubmitted);

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
              <ReviewRow
                song={song}
                isUserView={isUserView}
                isGroupView={isGroupView}
                isAuthenticated={isAuthenticated}
                expandedSongId={expandedSongId}
                currentRatings={currentRatings}
                reviewContents={reviewContents}
                submitting={submitting}
                successMessages={successMessages}
                editingComments={editingComments}
                handleExpand={handleExpand}
                handleRatingChange={handleRatingChange}
                handleContentChange={handleContentChange}
              />

              {expandedSongId === song.id && (
                <ExpandedReviewSection
                  song={song}
                  isAuthenticated={isAuthenticated}
                  loadingReviews={loadingReviews}
                  userReviewsRef={userReviewsRef}
                  user={user}
                />
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(ReviewsTable);
