import prisma from "../src/db/prisma";
import { User } from "@prisma/client";
import jwt from "jsonwebtoken";

export const createTestUser = async (): Promise<{
  user: User;
  token: string;
}> => {
  const user = await prisma.user.create({
    data: {
      email: `test${Date.now()}@test.com`,
      username: `testuser${Date.now()}`,
      password: "Test123!",
    },
  });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);
  return { user, token };
};

export const cleanupTestData = async () => {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.song.deleteMany(),
    prisma.album.deleteMany(),
    prisma.userGroup.deleteMany(),
    prisma.group.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};
