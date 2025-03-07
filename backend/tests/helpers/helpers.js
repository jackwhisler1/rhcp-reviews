import { PrismaClient } from "@prisma/client";
import { startServer } from "../src/server.js";
const prisma = new PrismaClient();
let testServer = null;
let port = 0;
export const setupTestEnvironment = () => {
    if (!testServer) {
        testServer = startServer();
        port = testServer.address().port;
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
