import { app } from "../dist/server.js";
import {
  cleanupTestData,
  setupTestEnvironment,
  stopTestServer,
} from "./helpers.js";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

beforeEach(async () => {
  await cleanupTestData(); // Clear existing data
});

// Setup test environment once at the root level
setupTestEnvironment();

const unique = Date.now();

it("should register/login/access protected route", async () => {
  const unique = Date.now();
  const registerRes = await request(app)
    .post("/api/users/register")
    .send({
      username: `testuser${unique}`,
      email: `test${unique}@example.com`,
      password: "test1234",
    });

  expect(registerRes.status).toBe(201);
});
