import { Server } from "http";
import { startServer, stopServer } from "../../src/server";
import { prisma, disconnectDB } from "./db";

let testServer: Server | null = null;

export const setupTestEnvironment = async () => {
  testServer = await startServer();
  await prisma.$connect();
  return testServer;
};

export const teardownTestEnvironment = async () => {
  if (testServer) {
    await stopServer();
    testServer = null;
  }
  await disconnectDB();
};
