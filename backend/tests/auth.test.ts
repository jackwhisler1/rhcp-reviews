import * as request from "supertest";
import { app } from "../src/server.js";
import { cleanupTestData } from "./helpers.js";

beforeEach(async () => await cleanupTestData());
afterAll(async () => await cleanupTestData());

describe("Authentication Flow", () => {
  it("should register/login/access protected route", async () => {
    // Registration
    const registerRes = await request(app).post("/api/users/register").send({
      email: "test@user.com",
      username: "testuser",
      password: "Test123!",
    });
    expect(registerRes.status).toBe(201);

    // Login
    const loginRes = await request(app).post("/api/users/login").send({
      email: "test@user.com",
      password: "Test123!",
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    // Protected Route Access
    const profileRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(profileRes.status).toBe(200);
  });
});
