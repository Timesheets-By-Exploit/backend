import request from "supertest";
import app from "@app";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import { clearDB } from "@tests/utils";

const verifiedUserEmail = "verified@example.com";
const nonVerifiedUserEmail = "nonverified@example.com";
const testPassword = "secret123";

beforeEach(async () => {
  await clearDB();
});

beforeEach(async () => {
  await seedOneUserWithOrg({
    email: verifiedUserEmail,
    password: testPassword,
    isEmailVerified: true,
  });
  await seedOneUserWithOrg({
    email: nonVerifiedUserEmail,
    password: testPassword,
    isEmailVerified: false,
  });
});

describe("Auth Login", () => {
  it.only("should return 400 password is incorrect", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: "RANDOM",
    });

    expect(res.status).toBe(400);
  });
  it.only("should return 400 if email is missing in request body", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      password: testPassword,
    });
    expect(res.status).toBe(400);
  });
  it.only("should return 400 if password is missing in request body", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
    });
    expect(res.status).toBe(400);
  });
  it.only("should return 403 if email is unverified", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: nonVerifiedUserEmail,
      password: testPassword,
    });
    expect(res.status).toBe(403);
  });
  it.only("should return 200 and JWT when credentials are correct", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const access = cookieArray.find((c) => c.startsWith("access_token="));
    const refresh = cookieArray.find((c) => c.startsWith("refresh_token="));

    expect(access).toContain("HttpOnly");
    expect(access).toContain("SameSite=Lax");
    expect(access).toContain("Path=/");

    expect(refresh).toContain("HttpOnly");
    expect(refresh).toContain("SameSite=Lax");
    expect(refresh).toContain("Path=/auth/refresh");

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
  });
});
