import prisma from "../src/db/prisma.js";
import { startServer } from "../src/server.js";

let testServer: ReturnType<typeof startServer> | null = null;
let port: number = 0;

export const setupTestEnvironment = () => {
  if (!testServer) {
    testServer = startServer();
    port = (testServer.address() as any).port;
  }
  return { port };
};

export const stopTestServer = () => {
  if (testServer) {
    testServer.close();
    testServer = null;
  }
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
