import React from "react";
import { Rating } from "react-simple-star-rating";
import { UserReview } from "../../types/rhcp-types";
import { ReactComponent as PepperAvatar } from "../../assets/pepper-avatar.svg";

interface ReviewItemProps {
  review: UserReview;
  isCurrentUser: boolean;
  formatDate: (date: string) => string;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  isCurrentUser,
  formatDate,
}) => {
  const color = review.author.avatarColor || "";
  // useEffect() => {} // TODO: set color when saved
  return (
    <div className="bg-white p-3 rounded border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <PepperAvatar className="w-5 h-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {review.author?.username || "Anonymous"}
              {isCurrentUser && (
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
  );
};

export default React.memo(ReviewItem);
