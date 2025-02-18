import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import { NotFoundError, ValidationError } from "../errors/customErrors";

export const getSongsService = async (filters: {
  albumId?: string;
  search?: string;
  limit?: number;
  page?: number;
}) => {
  const where: Prisma.SongWhereInput = {
    ...(filters.albumId && { albumId: Number(filters.albumId) }),
    ...(filters.search && {
      title: { contains: filters.search, mode: "insensitive" },
    }),
  };

  const [songs, total] = await prisma.$transaction([
    prisma.song.findMany({
      where,
      include: { album: { select: { title: true, artworkUrl: true } } },
    }),
    prisma.song.count({ where }),
  ]);

  return {
    data: songs,
    meta: {
      total,
      page: filters.page || 1,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    },
  };
};

export const getSongService = async (songId: number) => {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      album: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true, image: true } },
        },
      },
    },
  });

  if (!song) throw new NotFoundError("Song not found");
  return song;
};

export const createSongService = async (data: Prisma.SongCreateInput) => {
  if (!data.title || data.title.trim().length < 2) {
    throw new ValidationError("Song title must be at least 2 characters", {
      title: data.title,
    });
  }

  if (!data.album) {
    throw new ValidationError("Album ID is required", { albumId: data.album });
  }

  return prisma.song.create({
    data,
    include: { album: true },
  });
};

export const updateSongService = async (
  songId: number,
  data: Prisma.SongUpdateInput
) => {
  return prisma.song.update({
    where: { id: songId },
    data,
    include: { album: true },
  });
};

export const deleteSongService = async (songId: number) => {
  return prisma.song.delete({
    where: { id: songId },
  });
};
