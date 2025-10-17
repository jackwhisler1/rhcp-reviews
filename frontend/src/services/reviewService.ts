import {
  PaginatedReviews,
  AlbumReviewSummary,
  ReviewFilters,
  Review,
} from "../types/review";
import { API_BASE } from "./albumService";
import { getCurrentUser } from "./authService";
import axios from "axios";
export class ReviewService {
  async getReviews(
    songId?: number,
    albumId?: number,
    filters: ReviewFilters = {},
    page = 1,
    limit = 10
  ): Promise<PaginatedReviews> {
    try {
      const user = getCurrentUser();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const queryParams = new URLSearchParams();

      if (filters.groupId) {
        queryParams.append("groupId", filters.groupId.toString());
      }

      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      if (songId) {
        queryParams.append("songId", songId.toString());
      }

      if (albumId) {
        queryParams.append("albumId", albumId.toString());
      }

      const url = `${API_BASE}/reviews?${queryParams.toString()}`;

      console.log(`Requesting reviews from: ${url}`);

      const response = await axios.get<PaginatedReviews>(url, { headers });

      console.log("Reviews response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw new Error("Failed to load reviews");
    }
  }

  async createReview(reviewData: Partial<Review>): Promise<Review> {
    try {
      const user = getCurrentUser();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const response = await axios.post<Review>(
        `${API_BASE}/reviews`,
        reviewData,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create review", error);
      throw error;
    }
  }

  async updateReview(
    reviewId: number,
    reviewData: Partial<Review>
  ): Promise<Review> {
    try {
      const user = getCurrentUser();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const response = await axios.patch<Review>(
        `${API_BASE}/reviews/${reviewId}`,
        reviewData,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update review ${reviewId}`, error);
      throw error;
    }
  }

  async deleteReview(reviewId: number): Promise<void> {
    try {
      const user = getCurrentUser();
      const headers: Record<string, string> = {};

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      await axios.delete(`${API_BASE}/reviews/${reviewId}`, { headers });
    } catch (error) {
      console.error(`Failed to delete review ${reviewId}`, error);
      throw error;
    }
  }

  async getAlbumReviewSummary(
    albumId: number,
    filters: ReviewFilters = {},
    page = 1,
    limit = 10
  ): Promise<AlbumReviewSummary> {
    try {
      const user = getCurrentUser();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const queryParams = new URLSearchParams();

      if (filters.groupId) {
        queryParams.append("groupId", filters.groupId.toString());
      }

      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE}/reviews/album/${albumId}/summary?${queryParams.toString()}`;

      console.log(`Requesting album review summary from: ${url}`);

      const response = await axios.get<AlbumReviewSummary>(url, { headers });

      console.log("Album review summary response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching album review summary:", error);
      throw new Error("Failed to load album review summary");
    }
  }

  async getSongReviews(
    songId: number,
    filters: ReviewFilters = {},
    page = 1,
    limit = 10
  ): Promise<PaginatedReviews> {
    try {
      const user = getCurrentUser();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const queryParams = new URLSearchParams();

      if (filters.groupId) {
        queryParams.append("groupId", filters.groupId.toString());
      }

      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE}/reviews/song/${songId}?${queryParams.toString()}`;

      console.log(`Requesting song reviews from: ${url}`);

      const response = await axios.get<PaginatedReviews>(url, { headers });

      console.log("Song reviews response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching song reviews:", error);
      throw new Error("Failed to load song reviews");
    }
  }
}
export const reviewService = new ReviewService();
