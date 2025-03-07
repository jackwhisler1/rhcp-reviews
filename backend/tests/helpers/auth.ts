import { app } from "../../src/server";
import request from "supertest";
import { prisma } from "./db";

export async function getTestUserToken() {
  const user = await prisma.user.upsert({
    where: { email: "test1@example.com" },
    update: {},
    create: {
      username: "testuser",
      email: "test1@example.com",
      password: "$2a$10$Jt1f9PQBqsOKbc5Bdy/H6.b.3PVhha6JAWaFz0Z5QbFvMJyY1UDuW",
    },
  });

  const loginRes = await request(app).post("/api/auth/login").send({
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
