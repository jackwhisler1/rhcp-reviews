export interface SongStat {
  id: number;
  title: string;
  trackNumber: number;
  duration: string;
  publicAverage: number;
  reviewCount: number;
  groupAverage: number;
  groupReviewCount: number;
  currentUserRating?: number;
  selectedUserRating?: number;
  currentUserReviewId: number | null;
  userReviews?: UserReview[];
}

export interface Album {
  id: number;
  title: string;
  artworkUrl: string;
  releaseDate: string;
}

export interface UserReview {
  id: number;
  userId: number;
  songId: number;
  groupId?: number;
  author: { id: number; username: string; image?: string | null };
  rating: number;
  content: string;
  createdAt: string;
}

export interface GroupMember {
  id: number;
  username: string;
  email: string;
  image?: string | null;
  role: string;
  joinedAt: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  isPrivate: boolean;
  memberCount: number;
  role: string;
  joinedAt: string;
  createdAt: string;
  inviteCode: string;
}

export interface FiltersState {
  groupId: string;
  userId: string;
  selectedUserId: string;
}

export interface SongStatsProps {
  albumId: number;
  albumTitle: string;
  userId?: string;
  selectedUserId?: string;
  groups: Group[];
}
