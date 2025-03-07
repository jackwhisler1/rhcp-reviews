import { app } from "@/server";
import request from "supertest";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export async function getTestUserToken() {
  const hashedPassword = await bcrypt.hash("Test123!", 10); // Hash the test password

  const user = await prisma.user.upsert({
    where: { email: "test1@example.com" },
    update: { password: hashedPassword },
    create: {
      username: "testuser",
      email: "test1@example.com",
      password: hashedPassword,
    },
  });

  const loginRes = await request(app).post(`/api/auth/login`).send({
    email: "test1@example.com",
    password: "Test123!",
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
  }

  return {
    token: loginRes.body.token,
    userId: loginRes.body.user.id,
  };
}
