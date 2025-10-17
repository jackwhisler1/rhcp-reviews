// components/reviews/ReviewItem.tsx
import React from "react";
import { Rating } from "react-simple-star-rating";
import { Review } from "../../types/review";
import { useAuth } from "../../context/AuthContext";
import { TrashIcon, PencilIcon } from "@heroicons/react/20/solid";

interface ReviewItemProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: number) => void;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const isOwnReview = user?.id === review.userId;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 relative">
      {/* Review Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <img
            src={review.author.avatar || "/default-avatar.png"}
            alt={review.author.username}
            className="w-10 h-10 rounded-full object-cover"
          />

          {/* User Info */}
          <div>
            <p className="font-semibold text-gray-800">
              {review.author.username}
              {isOwnReview && (
                <span className="ml-2 text-xs text-gray-500">(You)</span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center">
          <Rating
            initialValue={review.rating / 2}
            readonly
            size={20}
            allowFraction
            iconsCount={5}
          />
          <span className="ml-2 text-sm font-medium">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Review Content */}
      {review.content && <p className="text-gray-700 mb-3">{review.content}</p>}

      {/* Edit/Delete Actions */}
      {isOwnReview && (
        <div className="absolute top-4 right-4 flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="text-blue-500 hover:text-blue-700"
              title="Edit Review"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="text-red-500 hover:text-red-700"
              title="Delete Review"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
