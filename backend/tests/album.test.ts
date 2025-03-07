import request from "supertest";
import { app } from "../src/server.js";
import { getTestUserToken } from "./helpers/auth";
import { setupTestData, cleanupTestData } from "./helpers/data";
import jwt from "jsonwebtoken";

describe("Album Operations", () => {
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

  it("should create/read/update/delete album", async () => {
    // Create Album
    const createRes = await request(app)
      .post("/api/albums")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Album",
        releaseDate: "2004-04-14T00:00:00Z",
        artworkUrl: "https://example.com/artwork.jpg",
      });

    expect(createRes.status).toBe(201);
    const albumId = createRes.body.id;
    console.log("Album ID:", albumId);
    // Read Album
    const getRes = await request(app).get(`/api/albums/stats/${albumId}`);
    expect(getRes.status).toBe(200);

    // Update Album
    const updateRes = await request(app)
      .put(`/api/albums/${albumId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Updated Title",
      });

    expect(updateRes.status).toBe(200);

    // Delete Album
    const deleteRes = await request(app)
      .delete(`/api/albums/${albumId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(204);
  });
});
