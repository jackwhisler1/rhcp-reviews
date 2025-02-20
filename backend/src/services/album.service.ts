import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";

interface SongStatsParams {
  albumId: number;
  groupId?: number;
  userId?: number;
}

export const createAlbumService = async (data: Prisma.AlbumCreateInput) => {
  return prisma.album.create({
    data: {
      ...data,
      releaseDate: new Date(data.releaseDate),
    },
  });
};

// export const getAlbumStatsService = async (albumId: number) => {
//   const [reviews, averageRating, songs] = await prisma.$transaction([
//     prisma.review.findMany({
//       where: { song: { albumId } },
//       select: { id: true, rating: true },
//     }),
//     prisma.review.aggregate({
//       _avg: { rating: true },
//       where: { song: { albumId } },
//     }),
//     prisma.song.findMany({
//       where: { albumId },
//       select: { id: true, title: true },
//     }),
//   ]);

//   return {
//     reviewCount: reviews.length,
//     averageRating: averageRating._avg.rating || 0,
//     songCount: songs.length,
//     songs,
//   };
// };

export const getAlbumSongStatsService = async ({
  albumId,
  groupId,
  userId,
}: SongStatsParams) => {
  // Get all songs in the album
  const songs = await prisma.song.findMany({
    where: { albumId },
    select: { id: true, title: true, trackNumber: true, duration: true },
  });

  // Build review filter
  const reviewFilter: any = {
    song: { albumId },
    ...(groupId && { groupId }),
    ...(userId && { userId }),
  };

  // Get aggregated stats
  const aggregatedStats = await prisma.review.groupBy({
    by: ["songId"],
    where: reviewFilter,
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Get user reviews if applicable
  let userReviews: any[] = [];
  if (userId) {
    userReviews = await prisma.review.findMany({
      where: { userId, song: { albumId } },
      select: { songId: true, rating: true },
    });
  }

  // Merge data
  return songs.map((song) => {
    const stats = aggregatedStats.find((s) => s.songId === song.id);
    const userReview = userReviews.find((r) => r.songId === song.id);

    return {
      id: song.id,
      title: song.title,
      trackNumber: song.trackNumber,
      duration: song.duration,
      averageRating: stats?._avg.rating || 0,
      reviewCount: stats?._count.rating || 0,
      userRating: userReview?.rating || null,
    };
  });
};

export const getPaginatedAlbumsService = async (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const where: Prisma.AlbumWhereInput = params.search
    ? { OR: [{ title: { contains: params.search, mode: "insensitive" } }] }
    : {};

  const [total, albums] = await prisma.$transaction([
    prisma.album.count({ where }),
    prisma.album.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { releaseDate: "desc" },
      include: {
        songs: {
          include: {
            reviews: true,
          },
        },
      },
    }),
  ]);

  return {
    data: albums,
    meta: {
      total,
      page: params.page,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

export const updateAlbumService = async (
  id: number,
  data: Prisma.AlbumUpdateInput
) => {
  if (data.releaseDate && typeof data.releaseDate === "string") {
    data.releaseDate = new Date(data.releaseDate);
  }

  return prisma.album.update({
    where: { id },
    data,
  });
};

export const deleteAlbumService = async (id: number) => {
  return prisma.album.delete({
    where: { id },
  });
};
