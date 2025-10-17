import { useState, useCallback, useEffect, useRef } from "react";
import { Review, ReviewFilters } from "../types/review";
import { reviewService, ReviewService } from "../services/reviewService";
import { useAuth } from "../context/AuthContext";

interface UseReviewsOptions {
  songId?: number;
  albumId?: number;
  initialFilters?: ReviewFilters;
  pageSize?: number;
}

export function useReviews({
  songId,
  albumId,
  initialFilters = {},
  pageSize = 10,
}: UseReviewsOptions) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filters, setFilters] = useState<ReviewFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Track local optimistic updates
  const prevReviewsRef = useRef<Review[]>([]);

  // Merge new reviews with optimistic updates
  const mergeWithPrevReviews = useCallback((newReviews: Review[]) => {
    if (!prevReviewsRef.current.length) return newReviews;

    const prevById = new Map(prevReviewsRef.current.map((r) => [r.id, r]));
    return newReviews.map((r) => {
      const prev = prevById.get(r.id);
      return prev ? { ...r, ...prev } : r;
    });
  }, []);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination]);
  const fetchReviews = useCallback(async () => {
    if (!songId && !albumId) return;
    setLoading(true);

    try {
      const result = await reviewService.getReviews(
        songId,
        albumId,
        {
          ...initialFilters,
          ...(albumId ? { albumId } : {}),
        },
        pagination.page,
        pageSize
      );

      const mergedReviews = mergeWithPrevReviews(result.reviews);
      prevReviewsRef.current = mergedReviews;
      setReviews(mergedReviews);
      setPagination({
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [
    songId,
    albumId,
    initialFilters,
    pagination.page,
    pageSize,
    mergeWithPrevReviews,
  ]);

  const addReview = useCallback(
    async (reviewData: Partial<Review>) => {
      try {
        const newReview = await reviewService.createReview({
          ...reviewData,
          songId,
          userId: user?.id,
        });
        setReviews((prev) => [newReview, ...prev]);
        prevReviewsRef.current = [newReview, ...prevReviewsRef.current];
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add review");
      }
    },
    [songId, user?.id]
  );

  const updateReview = useCallback(
    async (reviewId: number, reviewData: Partial<Review>) => {
      try {
        const updated = await reviewService.updateReview(reviewId, reviewData);
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, ...updated } : r))
        );
        prevReviewsRef.current = prevReviewsRef.current.map((r) =>
          r.id === reviewId ? { ...r, ...updated } : r
        );
        return updated;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update review"
        );
        throw err;
      }
    },
    []
  );

  const deleteReview = useCallback(async (reviewId: number) => {
    try {
      await reviewService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      prevReviewsRef.current = prevReviewsRef.current.filter(
        (r) => r.id !== reviewId
      );
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review");
      throw err;
    }
  }, []);

  // Re-fetch when filters or page changes
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    pagination,
    addReview,
    updateReview,
    deleteReview,
    loadMore,
    setFilters,
    refreshReviews: fetchReviews,
  };
}
