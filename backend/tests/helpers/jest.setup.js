import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import * as _jest from "@jest/globals";
const { jest, beforeAll, afterAll } = _jest;
// Ensure environment variables are loaded before anything else
dotenv.config({ path: ".env.test" });
// Create a test database client that will be shared across tests
export const prisma = new PrismaClient();
// Set longer timeout for tests
jest.setTimeout(30000);
// Global setup - runs once before all tests
beforeAll(async () => {
    // Connect to the database
    await prisma.$connect();
    console.log("Connected to test database");
});
// Global teardown - runs once after all tests
afterAll(async () => {
    await prisma.$disconnect();
    console.log("Disconnected from test database");
    // Add a small delay to ensure all connections are closed
    await new Promise((resolve) => setTimeout(resolve, 500));
});
afterEach(async () => {
    await prisma.$transaction([
    // prisma.review.deleteMany(),
    // prisma.song.deleteMany(),
    // prisma.album.deleteMany(),
    // prisma.user.deleteMany(),
    ]);
});
