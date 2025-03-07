import { PrismaClient } from "@prisma/client";
import { app } from "../src/server";
import request from "supertest";
// Export everything needed by tests
export const prisma = new PrismaClient();
// Helper for authentication
export async function getTestUserToken() {
    try {
        // Create test user if it doesn't exist
        const user = await prisma.user.upsert({
            where: { email: "test1@example.com" },
            update: {},
            create: {
                username: "testuser",
                email: "test1@example.com",
                password: "$2a$10$Jt1f9PQBqsOKbc5Bdy/H6.b.3PVhha6JAWaFz0Z5QbFvMJyY1UDuW", // Test123!
            },
        });
        // Login to get token
        const loginRes = await request(app).post(`/api/auth/login`).send({
            email: "test1@example.com",
            password: "Test123!",
        });
        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
        }
        return {
            token: loginRes.body.token,
            userId: loginRes.body.id || user.id,
        };
    }
    catch (error) {
        console.error("Failed to get test token:", error);
        throw error;
    }
}
// Test data setup
export async function setupTestData() {
    try {
        // Create test album if needed
        const album = await prisma.album.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                title: "Test Album",
                releaseDate: "4/14/2004",
                artworkUrl: "test.jpg",
            },
        });
        // Create test song if needed
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
    }
    catch (error) {
        console.error("Failed to set up test data:", error);
        throw error;
    }
}
// Test cleanup
export async function cleanupTestData() {
    try {
        await prisma.$transaction([
            prisma.review.deleteMany(),
            prisma.song.deleteMany({ where: { id: 519 } }),
            prisma.album.deleteMany({ where: { id: 1 } }),
            prisma.user.deleteMany({ where: { email: "test1@example.com" } }),
        ]);
    }
    catch (error) {
        console.error("Failed to clean up test data:", error);
    }
}
