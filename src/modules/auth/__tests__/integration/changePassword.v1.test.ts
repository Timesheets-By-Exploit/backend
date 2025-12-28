import request from "supertest";
import app from "@app";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import { clearDB } from "@tests/utils";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";
import UserModel from "@modules/user/user.model";
import { compareHashedBcryptString } from "@utils/encryptors";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "../helpers/testHelpers";

const { verifiedUserEmail, testPassword, newPassword } = TEST_CONSTANTS;

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

describe("POST /api/v1/auth/change-password", () => {
  it("should return 401 if access token cookie is missing", async () => {
    const res = await request(app).post("/api/v1/auth/change-password").send({
      currentPassword: testPassword,
      newPassword: newPassword,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Authentication required");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", ["access_token=invalid_token"])
      .send({
        currentPassword: testPassword,
        newPassword: newPassword,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if currentPassword is missing", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        newPassword: newPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if newPassword is missing", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: testPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if newPassword is less than 6 characters", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: testPassword,
        newPassword: "12345",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if newPassword is the same as currentPassword", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: testPassword,
        newPassword: testPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if current password is incorrect", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: "wrongPassword",
        newPassword: newPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Current password is incorrect");
  });

  it("should successfully change password with valid credentials", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: testPassword,
        newPassword: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Password changed successfully");
  });

  it("should update password in database after successful change", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: testPassword,
        newPassword: newPassword,
      });

    expect(res.status).toBe(200);

    const updatedUser = await UserModel.findById(user._id);
    if (!updatedUser) throw new Error("User not found");

    const isNewPasswordValid = await compareHashedBcryptString(
      newPassword,
      updatedUser.password,
    );
    expect(isNewPasswordValid).toBe(true);

    const isOldPasswordInvalid = await compareHashedBcryptString(
      testPassword,
      updatedUser.password,
    );
    expect(isOldPasswordInvalid).toBe(false);
  });

  it("should allow login with new password after change", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: testPassword,
        newPassword: newPassword,
      });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: newPassword,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it("should not allow login with old password after change", async () => {
    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    const cookie = createSignedAccessTokenCookie(accessToken);

    await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [cookie])
      .send({
        currentPassword: testPassword,
        newPassword: newPassword,
      });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: testPassword,
    });

    expect(loginRes.status).toBe(400);
    expect(loginRes.body.success).toBe(false);
  });
});
