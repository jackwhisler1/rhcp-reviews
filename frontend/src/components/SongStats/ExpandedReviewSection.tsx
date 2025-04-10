// ExpandedReviewSection.tsx
import React from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat, UserReview } from "../../types/rhcp-types";
import ReviewItem from "./ReviewItem";

interface ExpandedReviewSectionProps {
  song: SongStat;
  isAuthenticated: boolean;
  loadingReviews: { [key: number]: boolean };
  userReviewsRef: React.MutableRefObject<{ [key: number]: UserReview[] }>;
  user: any;
}

const ExpandedReviewSection: React.FC<ExpandedReviewSectionProps> = ({
  song,
  isAuthenticated,
  loadingReviews,
  userReviewsRef,
  user,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <tr>
      <td colSpan={isAuthenticated ? 7 : 6} className="px-4 py-4 bg-gray-50">
        <div className="border-t border-b border-gray-200 py-4">
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
                <ReviewItem
                  key={review.id}
                  review={review}
                  isCurrentUser={user && review.userId === user.id}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded border border-gray-200">
              <p className="text-gray-500">No reviews yet for this song.</p>
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
  );
};

export default React.memo(ExpandedReviewSection);
