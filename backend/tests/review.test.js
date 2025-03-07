import { app } from "../dist/server.js";
import request from "supertest";
import { prisma, getTestUserToken, setupTestData, cleanupTestData, } from "./utils.js";
describe("Review Operations", () => {
    let authToken;
    let userId;
    // Setup
    beforeAll(async () => {
        await prisma.$connect();
        await setupTestData();
        const auth = await getTestUserToken();
        authToken = auth.token;
        userId = auth.userId;
    });
    // Cleanup
    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });
    it("should create a review", async () => {
        // Create review
        const createRes = await request(app)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            content: "This is a test review.",
            rating: 7.5,
            songId: 519,
            userId: userId,
        });
        expect(createRes.status).toBe(201);
        expect(createRes.body.id).toBeDefined();
    });
});
