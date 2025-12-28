import request from "supertest";
import app from "@app";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import { clearDB } from "@tests/utils";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";
import UserModel from "@modules/user/user.model";
import * as jwt from "jsonwebtoken";
import * as signature from "cookie-signature";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "../helpers/testHelpers";

const { verifiedUserEmail, testPassword } = TEST_CONSTANTS;

beforeEach(async () => {
  await clearDB();
});

beforeEach(async () => {
  await seedOneUserWithOrg({
    email: verifiedUserEmail,
    password: testPassword,
    isEmailVerified: true,
  });
});

describe("GET /api/v1/auth/me", () => {
  it("should return 401 if access token cookie is missing", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Authentication required");
  });

  it("should return 401 if access token is unsigned/invalid", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", ["access_token=invalid_token"]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if access token has invalid signature", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    // Sign with wrong secret
    const wrongSignedToken =
      "s:" + signature.sign(accessToken, "wrong_secret_key");

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [`access_token=${wrongSignedToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if access token JWT is malformed", async () => {
    const malformedToken = "not.a.valid.jwt";
    const cookie = createSignedAccessTokenCookie(malformedToken);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if access token is expired", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    // Create an expired token
    const expiredToken = jwt.sign(
      { id: user._id.toString(), email: user.email },
      "testsecret",
      { expiresIn: "-1h" },
    );

    const cookie = createSignedAccessTokenCookie(expiredToken);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("expired");
  });

  it("should return 401 if user in token does not exist", async () => {
    const nonExistentUserId = "507f1f77bcf86cd799439011";
    const accessToken = generateAccessToken({
      id: nonExistentUserId,
      email: "nonexistent@example.com",
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("User not found");
  });

  it("should return 200 with user data when valid access token is provided", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user).toBeDefined();
  });

  it("should return correct user data structure", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [cookie]);

    expect(res.status).toBe(200);

    const { user: userData } = res.body.data;

    expect(userData.id).toBe(user._id.toString());
    expect(userData.email).toBe(user.email);
    expect(userData.role).toBe(user.role);
    expect(userData.isEmailVerified).toBe(user.isEmailVerified);
    expect(userData.createdAt).toBeDefined();
    expect(userData.updatedAt).toBeDefined();

    expect(userData.password).toBeUndefined();
    expect(userData.emailVerificationCode).toBeUndefined();
    expect(userData.emailVerificationCodeExpiry).toBeUndefined();
  });

  it("should work with access token obtained from login flow", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: testPassword,
    });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers["set-cookie"];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const accessCookie = cookieArray.find((c) => c.startsWith("access_token="));

    if (!accessCookie) throw new Error("Access token cookie not found");

    const accessTokenValue = accessCookie.split(";")[0];

    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [accessTokenValue]);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe(verifiedUserEmail);
  });
});
