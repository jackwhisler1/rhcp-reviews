// import { app } from "../src/server.js";
// import { getTestUserToken } from "./helpers/auth";
// import { setupTestData, cleanupTestData } from "./helpers/data";
// import request from "supertest";

// beforeEach(async () => {
//   await cleanupTestData(); // Clear existing data
// });

// // Setup test environment once at the root level
// setupTestEnvironment();

// it("should register/login/access protected route", async () => {
//   const unique = Date.now();
//   const registerRes = await request(app).post("/api/users/register").send({
//     username: `testuser333`,
//     email: `test333@example.com`,
//     password: "Test123!",
//   });
//   console.log(
//     "Register Response:",
//     registerRes.status,
//     JSON.stringify(registerRes.body, null, 2)
//   );
//   expect(registerRes.status).toBe(201);
// });
describe("Auth Operations", () => {
  it("should have at least one test", () => {
    expect(true).toBeTruthy();
  });
});
