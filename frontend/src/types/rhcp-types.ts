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
  username: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  image?: string;
  isPrivate: boolean;
  inviteCode?: string;
  createdAt: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  image?: string;
}

export interface GroupMember {
  id: number;
  username: string;
  image?: string;
}

export interface FiltersState {
  groupId: string;
  userId: string;
  showUserOnly: boolean;
}
