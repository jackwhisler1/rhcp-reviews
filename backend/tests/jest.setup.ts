import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
beforeEach(async () => {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.song.deleteMany(),
    prisma.album.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.song.deleteMany(),
    prisma.album.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
