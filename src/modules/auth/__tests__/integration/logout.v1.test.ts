import request from "supertest";
import app from "@app";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import {
  clearDB,
  extractSignedCookies,
  extractSignedCookie,
} from "@tests/utils";
import { RefreshTokenModel } from "@modules/auth/refreshToken.model";
import UserModel from "@modules/user/user.model";
import { TEST_CONSTANTS } from "../helpers/testHelpers";

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

describe("Auth Logout", () => {
  it("clears access and refresh cookies on logout", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: verifiedUserEmail, password: testPassword });

    expect(loginRes.status).toBe(200);

    const loginCookies = extractSignedCookies(loginRes.headers["set-cookie"], [
      "access_token",
      "refresh_token",
    ]);

    if (!loginCookies.access_token || !loginCookies.refresh_token) {
      throw new Error("Login cookies not found");
    }

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [
        `access_token=${loginCookies.access_token}`,
        `refresh_token=${loginCookies.refresh_token}`,
      ]);

    const cookies = res.headers["set-cookie"];
    if (!cookies) {
      throw new Error("No set-cookie header found");
    }

    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const cookieString = cookieArray.join(" ");

    expect(cookieString).toMatch(/access_token=.*(Max-Age=0|Expires=)/);
    expect(cookieString).toMatch(/refresh_token=.*(Max-Age=0|Expires=)/);
  });
  it("blocks protected routes after logout", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: verifiedUserEmail, password: testPassword });

    expect(loginRes.status).toBe(200);

    const loginCookies = extractSignedCookies(loginRes.headers["set-cookie"], [
      "access_token",
      "refresh_token",
    ]);

    if (!loginCookies.access_token || !loginCookies.refresh_token) {
      throw new Error("Login cookies not found");
    }

    await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [
        `access_token=${loginCookies.access_token}`,
        `refresh_token=${loginCookies.refresh_token}`,
      ]);

    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
  it("logout is idempotent", async () => {
    const firstRes = await request(app).post("/api/v1/auth/logout");
    expect(firstRes.status).toBe(200);

    const res = await request(app).post("/api/v1/auth/logout");
    expect(res.status).toBe(200);
  });
  it("logout works without authentication", async () => {
    const res = await request(app).post("/api/v1/auth/logout");
    expect(res.status).toBe(200);
  });
  it("revokes refresh token in database", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: verifiedUserEmail, password: testPassword });

    expect(loginRes.status).toBe(200);

    const refreshTokenValue = extractSignedCookie(
      loginRes.headers["set-cookie"],
      "refresh_token",
    );
    if (!refreshTokenValue) throw new Error("Refresh token cookie not found");

    const userDoc = await UserModel.findOne({ email: verifiedUserEmail });
    if (!userDoc) throw new Error("User not found");

    const tokenDoc = await RefreshTokenModel.findOne({
      user: userDoc._id,
      revokedAt: null,
    });

    if (!tokenDoc) throw new Error("Refresh token not found");

    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [`refresh_token=${refreshTokenValue}`]);

    expect(logoutRes.status).toBe(200);

    const revoked = await RefreshTokenModel.findById(tokenDoc._id);
    expect(revoked?.revokedAt).not.toBeNull();
  });
});
