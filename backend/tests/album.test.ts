import request from "supertest";
import { app } from "../src/server.js";
import { setupTestEnvironment, stopTestServer } from "./helpers.js";
import jwt from "jsonwebtoken";

// Setup test environment once at the root level
setupTestEnvironment();

describe("Album Operations", () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Register user
    const registerRes = await request(app).post(`/api/users/register`).send({
      username: "testuser2",
      email: "test1@example.com",
      password: "Test123!",
    });
    console.log(
      "Register Response:",
      registerRes.status,
      JSON.stringify(registerRes.body, null, 2)
    );

    expect(registerRes.status).toBe(201);
    userId = registerRes.body.id;

    // Login to get token
    const loginRes = await request(app).post(`/api/users/login`).send({
      email: "test1@example.com",
      password: "Test123!",
    });
    console.log("Login Response:", loginRes.status, loginRes.body);

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.token;

    // Verify JWT token
    jwt.verify(authToken, process.env.JWT_SECRET as string);
  });

  afterAll(() => {
    stopTestServer();
  });

  it("should create/read/update/delete album", async () => {
    // Create Album
    const createRes = await request(app)
      .post("/api/albums")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Album",
        releaseDate: "2023-01-01",
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
