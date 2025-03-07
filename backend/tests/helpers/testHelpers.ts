import { PrismaClient } from "@prisma/client";
import { app } from "../../src/server";
import request from "supertest";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const TestHelpers = {
  setupTestData: async () => {
    // Create or update test user
    const user = await prisma.user.upsert({
      where: { email: "test1@example.com" },
      update: {},
      create: {
        email: "test1@example.com",
        username: "testuser",
        password: await bcrypt.hash("Test123!", 10),
      },
    });

    // Create or update test album
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

    // Create or update test song
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

    return { user, album, song };
  },

  cleanupTestData: async () => {
    await prisma.$transaction([
      prisma.review.deleteMany({
        where: { songId: 519 },
      }),
      prisma.song.deleteMany({
        where: { id: 519 },
      }),
      prisma.album.deleteMany({
        where: { id: 1 },
      }),
      prisma.user.deleteMany({ where: { email: "test1@example.com" } }),
    ]);
  },

  getTestUserToken: async () => {
    try {
      // Create or update test user with hashed password
      const user = await prisma.user.upsert({
        where: { email: "test1@example.com" },
        update: {
          password: await bcrypt.hash("Test123!", 10),
        },
        create: {
          username: "testuser",
          email: "test1@example.com",
          password: await bcrypt.hash("Test123!", 10),
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
        userId: loginRes.body.user?.id || user.id,
      };
    } catch (error) {
      console.error("Failed to get test token:", error);
      throw error;
    }
  },
};
