import request from "supertest";
import { app } from "../src/server";
import { prisma } from "./helpers/db";

function createRandomString(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

describe("Authentication System", () => {
  const id = createRandomString(7);
  const testUser = {
    email: `test-${id}@example.com`,
    password: "Test123!",
    username: `testuser-${id}`,
  };

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser); // Remove the { body: ... } wrapper

    expect(res.status).toBe(201);
  });

  it("should login with valid credentials", async () => {
    // First register the user
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app).post("/api/auth/login").send(testUser);

    expect(res.status).toBe(200);
  });

  it("should reject invalid login credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("should protect unauthorized access", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
  });

  it("should refresh access tokens", async () => {
    // Register first
    await request(app).post("/api/auth/register").send(testUser);

    // Then login
    const loginRes = await request(app).post("/api/auth/login").send(testUser);

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty("accessToken");
  });
});
