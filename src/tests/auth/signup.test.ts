import request from "supertest";
import app from "../../../src/app";
import { orgFixtures } from "../fixtures/organization";
import { userFixtures } from "../fixtures/user";

describe("User Signup", () => {
  it("should return 201 when a user signs up successfully", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        ...userFixtures.validOwner,
        organizationName: orgFixtures.validOrg.name,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("userId");
  });
  it("should return 400 if organizationName is missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        ...userFixtures.validOwner,
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        ...userFixtures.noEmail,
        organizationName: orgFixtures.validOrg.name,
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        ...userFixtures.noPassword,
        organizationName: orgFixtures.validOrg.name,
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        ...userFixtures.invalidEmail,
        organizationName: orgFixtures.validOrg.name,
      });

    expect(res.status).toBe(400);
  });
});
