export interface SongStat {
  id: number;
  title: string;
  trackNumber: number;
  duration: string;
  averageRating: number;
  reviewCount: number;
  userRating: number | null;
  groupAverage?: number;
  userReviews?: UserReview[];
}

export interface UserReview {
  id: number;
  userId: number;
  groupId?: number;
  username: string;
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
}

export interface FiltersState {
  groupId: string;
  userId: string;
  showUserOnly: boolean;
}

export interface SongStatsProps {
  albumId: number;
  albumTitle: string;
  userId?: string;
  groups: Group[];
}
