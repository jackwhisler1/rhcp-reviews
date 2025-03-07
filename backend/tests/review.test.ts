import { app } from "../src/server";
import request from "supertest";
import { getTestUserToken } from "./helpers/auth";
import { TestHelpers } from "./helpers/testHelpers";

describe("Review Operations", () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await TestHelpers.setupTestData();
    const auth = await getTestUserToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  it("should create a review", async () => {
    const response = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        content: "Test review",
        rating: 7.5,
        songId: 519,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });
});
