// RatingComponent.tsx
import React from "react";
import { Rating } from "react-simple-star-rating";

interface RatingComponentProps {
  songId: number;
  currentRating: number;
  userRating: number | null;
  submitting: boolean;
  successMessage: string;
  handleRatingChange: (songId: number, rating: number) => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  songId,
  currentRating,
  userRating,
  submitting,
  successMessage,
  handleRatingChange,
}) => {
  return (
    <div className="flex items-center justify-center relative">
      <Rating
        onClick={(rate) => handleRatingChange(songId, rate)}
        initialValue={(currentRating || userRating || 0) / 2}
        key={`rating-${songId}-${currentRating || userRating || 0}`}
        size={18}
        allowFraction
        iconsCount={5}
        transition
      />
      {submitting && (
        <div className="absolute -right-6">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
        </div>
      )}
      {successMessage && (
        <div className="absolute right-0 -bottom-5 text-xs text-green-600 whitespace-nowrap">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default React.memo(RatingComponent);
