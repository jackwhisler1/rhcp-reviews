import { prisma } from "./db";

export const setupTestData = async () => {
  const album = await prisma.album.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: "Test Album",
      releaseDate: "2004-04-14T00:00:00Z",
      artworkUrl: "test.jpg",
    },
  });

  const song = await prisma.song.upsert({
    where: { id: 519 },
    update: {},
    create: {
      id: 519,
      title: "Test Song",
      albumId: album.id,
      trackNumber: 1,
      duration: "4:56",
    },
  });

  return { album, song };
};

export const cleanupTestData = async () => {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.song.deleteMany({ where: { id: 519 } }),
    prisma.album.deleteMany({ where: { id: 1 } }),
    prisma.user.deleteMany({ where: { email: "test1@example.com" } }),
  ]);
};
