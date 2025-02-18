import * as request from "supertest";
import { app } from "../src/server.js";
import { createTestUser } from "./helpers.js";

describe("Album Operations", () => {
  let token: string;

  beforeAll(async () => {
    const { token: userToken } = await createTestUser();
    token = userToken;
  });

  it("should create/read/update/delete album", async () => {
    // Create
    const createRes = await request(app)
      .post("/api/albums")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Album",
        releaseDate: "2023-01-01",
        artworkUrl: "https://example.com/artwork.jpg",
      });
    expect(createRes.status).toBe(201);
    const albumId = createRes.body.id;

    // Read
    const getRes = await request(app).get(`/api/albums/${albumId}`);
    expect(getRes.status).toBe(200);

    // Update
    const updateRes = await request(app)
      .patch(`/api/albums/${albumId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Title" });
    expect(updateRes.status).toBe(200);

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/albums/${albumId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);
  });
});
