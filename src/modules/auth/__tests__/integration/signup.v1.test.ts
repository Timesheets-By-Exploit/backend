import request from "supertest";
import app from "@app";
import { userFixtures } from "@tests/fixtures/user";
import { UserFactory } from "@tests/factories/user.factory";
import { clearDB } from "@tests/utils";

beforeEach(async () => {
  await clearDB();
});

describe("Auth Signup", () => {
  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noEmail,
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noPassword,
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 if first name is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noFirstName,
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 if last name is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noLastName,
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.invalidEmail,
      });

    expect(res.status).toBe(400);
  });

  it("should return 201 when a user signs up successfully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...UserFactory.generate(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("userId");
    expect(res.body.data).toHaveProperty("emailSent");
    expect(res.body.data).not.toHaveProperty("organizationId");
  });
});
