import request from "supertest";
import app from "@app";
import mongoose from "mongoose";
import { userFixtures } from "@tests/fixtures/user";
import { UserFactory } from "@tests/factories/user.factory";
import { OrganizationFactory } from "@tests/factories/organization.factory";
import { clearDB } from "@tests/utils";

beforeEach(async () => {
  await clearDB();
});

describe("Auth Signup", () => {
  it("should return 400 if organization name is missing when createOrg is true", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...UserFactory.generate(),
        createOrg: true,
        organizationSize: 10,
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noEmail,
        ...OrganizationFactory.generate(),
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noPassword,
        ...OrganizationFactory.generate(),
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if first name is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noFirstName,
        ...OrganizationFactory.generate(),
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if last name is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.noLastName,
        ...OrganizationFactory.generate(),
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...userFixtures.invalidEmail,
        ...OrganizationFactory.generate(),
      });

    expect(res.status).toBe(400);
  });
  it("should return 400 if organization size is missing when createOrg is true", async () => {
    const orgData = OrganizationFactory.generate();
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...UserFactory.generate(),
        createOrg: true,
        organizationName: orgData.name,
      });

    expect(res.status).toBe(400);
  });
  it("should return 201 when a user signs up successfully with organization", async () => {
    const orgData = OrganizationFactory.generate();
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...UserFactory.generate(),
        createOrg: true,
        organizationName: orgData.name,
        organizationSize: orgData.size,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("userId");
    expect(res.body.data).toHaveProperty("organizationId");
  });

  it("should return 201 when a user signs up successfully without organization", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...UserFactory.generate(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("userId");
    expect(res.body.data).not.toHaveProperty("organizationId");
  });

  it("should return 201 when a user signs up with createOrg false", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...UserFactory.generate(),
        createOrg: false,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("userId");
    expect(res.body.data).not.toHaveProperty("organizationId");
  });
});
