import { app } from "../src/server";
import request from "supertest";
import { getTestUserToken } from "./helpers/auth";
import { setupTestData, cleanupTestData } from "./helpers/data";

describe("Review Operations", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestData();
    const auth = await getTestUserToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should create a review", async () => {
    const response = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        content: "Test review",
        rating: 7.5,
        songId: 519,
        userId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });
});
