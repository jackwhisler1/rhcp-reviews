export interface ReviewFilters {
  songId?: number;
  albumId?: number;
  groupId?: number;
  minRating?: number;
  maxRating?: number;
  sortBy?: "newest" | "highest" | "lowest";
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Review {
  id: number;
  songId: number;
  userId: number;
  groupId?: number;
  rating: number;
  content?: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
  song?: {
    id: number;
    title: string;
    trackNumber: number;
    album?: {
      id: number;
      title: string;
    };
  };
}

export interface ReviewSummary {
  songId: number;
  songTitle: string;
  trackNumber: number;
  totalReviews: number;
  averageRating: number;
}

export interface AlbumReviewSummary {
  songs: ReviewSummary[];
  total: number;
}
