import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";

export const createAlbumService = async (data: Prisma.AlbumCreateInput) => {
  return prisma.album.create({
    data: {
      ...data,
      releaseDate: new Date(data.releaseDate),
    },
  });
};

export const getAlbumStatsService = async (albumId: number) => {
  const [reviews, averageRating, songs] = await prisma.$transaction([
    prisma.review.findMany({
      where: { song: { albumId } },
      select: { id: true, rating: true },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      where: { song: { albumId } },
    }),
    prisma.song.findMany({
      where: { albumId },
      select: { id: true, title: true },
    }),
  ]);

  return {
    reviewCount: reviews.length,
    averageRating: averageRating._avg.rating || 0,
    songCount: songs.length,
    songs,
  };
};

export const getPaginatedAlbumsService = async (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const where: Prisma.AlbumWhereInput = params.search
    ? {
        OR: [{ title: { contains: params.search, mode: "insensitive" } }],
      }
    : {};

  const [total, albums] = await prisma.$transaction([
    prisma.album.count({ where }),
    prisma.album.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { releaseDate: "desc" },
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
  return prisma.album.update({
    where: { id },
    data: {
      ...data,
      releaseDate: data.releaseDate
        ? new Date(data.releaseDate as string)
        : undefined,
    },
  });
};

export const deleteAlbumService = async (id: number) => {
  return prisma.album.delete({
    where: { id },
  });
};
