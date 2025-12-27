import request from "supertest";
import app from "@app";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import { clearDB } from "@tests/utils";
import { RefreshTokenModel } from "@modules/auth/refreshToken.model";
import { hashWithCrypto } from "@utils/encryptors";
import { generateRandomTokenWithCrypto } from "@utils/generators";
import { convertTimeToMilliseconds } from "@utils/index";
import UserModel from "@modules/user/user.model";
import * as cookie from "cookie";
import * as signature from "cookie-signature";
import { COOKIE_SECRET } from "@config/env";

const verifiedUserEmail = "verified@example.com";
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
});

describe("Refresh Token", () => {
  it("should return 401 if refresh token cookie is missing", async () => {
    const res = await request(app).get("/api/v1/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if refresh token is invalid", async () => {
    const res = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", ["refresh_token=invalid_token"]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if refresh token is expired", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const rawRefreshToken = generateRandomTokenWithCrypto(64);
    const tokenHash = hashWithCrypto(rawRefreshToken);

    await RefreshTokenModel.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() - convertTimeToMilliseconds(1, "hr")),
    });

    const res = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawRefreshToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if refresh token is revoked", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const rawRefreshToken = generateRandomTokenWithCrypto(64);
    const tokenHash = hashWithCrypto(rawRefreshToken);

    await RefreshTokenModel.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + convertTimeToMilliseconds(7 * 24, "hr")),
      revokedAt: new Date(),
      reason: "logout",
    });

    const res = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${rawRefreshToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should successfully refresh tokens with valid refresh token", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: testPassword,
    });
    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers["set-cookie"];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const refreshCookie = cookieArray.find((c) =>
      c.startsWith("refresh_token="),
    );
    if (!refreshCookie) throw new Error("Refresh token cookie not found");

    const refreshToken = refreshCookie.split("=")[1].split(";")[0];
    const refreshRes = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${refreshToken}`]);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);

    const newCookies = refreshRes.headers["set-cookie"];
    expect(newCookies).toBeDefined();
    const newCookieArray = Array.isArray(newCookies)
      ? newCookies
      : [newCookies];
    const newAccess = newCookieArray.find((c) => c.startsWith("access_token="));
    const newRefresh = newCookieArray.find((c) =>
      c.startsWith("refresh_token="),
    );

    expect(newAccess).toBeDefined();
    expect(newRefresh).toBeDefined();
    expect(newAccess).toContain("HttpOnly");
    expect(newRefresh).toContain("HttpOnly");
  });

  it("should revoke old token when new refresh token is issued", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: testPassword,
    });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers["set-cookie"];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];

    const refreshSetCookie = cookieArray.find((c) =>
      c.startsWith("refresh_token="),
    );
    if (!refreshSetCookie) throw new Error("Refresh token cookie not found");

    const parsed = cookie.parse(refreshSetCookie);
    const signedValue = parsed.refresh_token;

    if (!signedValue?.startsWith("s:")) {
      throw new Error(
        `Expected signed refresh_token cookie, got: ${signedValue}`,
      );
    }

    const refreshToken = signature.unsign(
      signedValue.slice(2), // remove "s:"
      COOKIE_SECRET,
    );

    if (!refreshToken) throw new Error("Invalid refresh_token signature");
    const oldTokenHash = hashWithCrypto(refreshToken);
    const oldTokenDoc = await RefreshTokenModel.findOne({
      tokenHash: oldTokenHash,
    });
    expect(oldTokenDoc).toBeTruthy();
    expect(oldTokenDoc?.revokedAt).toBeNull();

    const refreshRes = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${signedValue}`]);

    expect(refreshRes.status).toBe(200);

    const revokedToken = await RefreshTokenModel.findOne({
      tokenHash: oldTokenHash,
    });
    expect(revokedToken?.revokedAt).toBeTruthy();
    expect(revokedToken?.replacedByToken).toBeTruthy();
  });

  it("should not allow reusing the same refresh token after it has been rotated", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: testPassword,
    });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers["set-cookie"];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const refreshCookie = cookieArray.find((c) =>
      c.startsWith("refresh_token="),
    );

    if (!refreshCookie) throw new Error("Refresh token cookie not found");

    const refreshToken = refreshCookie.split("=")[1].split(";")[0];

    // First refresh - should succeed
    const firstRefreshRes = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${refreshToken}`]);

    expect(firstRefreshRes.status).toBe(200);

    // Try to reuse the old token - should fail
    const secondRefreshRes = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", [`refresh_token=${refreshToken}`]);

    expect(secondRefreshRes.status).toBe(401);
    expect(secondRefreshRes.body.success).toBe(false);
  });

  it("should clear cookies when refresh token is invalid", async () => {
    const res = await request(app)
      .get("/api/v1/auth/refresh")
      .set("Cookie", ["refresh_token=invalid_token"]);

    expect(res.status).toBe(401);

    const cookies = res.headers["set-cookie"];
    if (cookies) {
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const clearedAccess = cookieArray.find(
        (c) => c.includes("access_token=") && c.includes("Max-Age=0"),
      );
      const clearedRefresh = cookieArray.find(
        (c) => c.includes("refresh_token=") && c.includes("Max-Age=0"),
      );

      expect(clearedAccess || clearedRefresh).toBeTruthy();
    }
  });
});
