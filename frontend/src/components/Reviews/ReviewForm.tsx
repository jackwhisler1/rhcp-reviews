// components/reviews/ReviewForm.tsx
import React, { useState, useEffect } from "react";
import { Rating } from "react-simple-star-rating";
import { Review } from "../../types/review";

interface ReviewFormProps {
  initialReview?: Partial<Review> | null;
  onSubmit: (reviewData: Partial<Review>) => Promise<void>;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  initialReview,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [content, setContent] = useState(initialReview?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when initial review changes
  useEffect(() => {
    setRating(initialReview?.rating || 0);
    setContent(initialReview?.content || "");
  }, [initialReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      // Optionally add validation feedback
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        content: content.trim() || undefined,
      });

      // Reset form after successful submission
      setRating(0);
      setContent("");
    } catch (error) {
      console.error("Review submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 mb-4"
    >
      <div className="mb-4">
        <label
          htmlFor="rating"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Rating
        </label>
        <div className="flex items-center">
          <Rating
            onClick={setRating}
            initialValue={rating / 2}
            size={30}
            allowFraction
            iconsCount={5}
          />
          <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Review (Optional)
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={4}
          placeholder="Share your thoughts about this song..."
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500 text-right">
          {content.length}/500
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {initialReview ? "Update Review" : "Submit Review"}
        </button>
      </div>
    </form>
  );
};
