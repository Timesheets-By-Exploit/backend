import request from "supertest";
import app from "@app";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import { clearDB } from "@tests/utils";
import { sendEmailWithTemplate } from "@services/email.service";
import UserModel from "@modules/user/user.model";
import { convertTimeToMilliseconds } from "@utils/index";
import { compareHashedBcryptString } from "@utils/encryptors";
import { TEST_CONSTANTS } from "../helpers/testHelpers";

jest.mock("@services/email.service");

const { verifiedUserEmail, testPassword, newPassword } = TEST_CONSTANTS;

beforeEach(async () => {
  await clearDB();
});

beforeEach(() => {
  (sendEmailWithTemplate as jest.Mock).mockResolvedValue({
    success: true,
    emailSent: true,
  });
});

function getPasswordResetCode(index = 0) {
  const call = (sendEmailWithTemplate as jest.Mock).mock.calls[index][0];
  return call.merge_info.passwordResetCode;
}

describe("POST /api/v1/auth/reset-password", () => {
  it("should return 400 if email is missing", async () => {
    const res = await request(app).post("/api/v1/auth/reset-password").send({
      passwordResetCode: "123456",
      newPassword: newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if passwordResetCode is missing", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      newPassword: newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if newPassword is missing", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: "123456",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if email is invalid format", async () => {
    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: "invalid-email",
      passwordResetCode: "123456",
      newPassword: newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if passwordResetCode is not 6 digits", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: "12345",
      newPassword: newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if newPassword does not meet requirements", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: "123456",
      newPassword: "weak",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if user does not exist", async () => {
    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: "nonexistent@example.com",
      passwordResetCode: "123456",
      newPassword: newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid or expired password reset code");
  });

  it("should return 400 if password reset code is invalid", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: "000000",
      newPassword: newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid or expired password reset code");
  });

  it("should return 400 if password reset code is expired", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const user = await UserModel.findOne({ email: verifiedUserEmail });
    if (user) {
      user.passwordResetCodeExpiry = new Date(
        Date.now() - convertTimeToMilliseconds(1, "min"),
      );
      await user.save();
    }

    const resetCode = getPasswordResetCode();

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: resetCode,
      newPassword: newPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid or expired password reset code");
  });

  it("should successfully reset password with valid code", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const resetCode = getPasswordResetCode();

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: resetCode,
      newPassword: newPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Password reset successfully");
  });

  it("should update password in database after successful reset", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const resetCode = getPasswordResetCode();

    await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: resetCode,
      newPassword: newPassword,
    });

    const user = await UserModel.findOne({ email: verifiedUserEmail });
    expect(user).toBeTruthy();

    const isNewPasswordValid = await compareHashedBcryptString(
      newPassword,
      user!.password,
    );
    expect(isNewPasswordValid).toBe(true);

    const isOldPasswordInvalid = await compareHashedBcryptString(
      testPassword,
      user!.password,
    );
    expect(isOldPasswordInvalid).toBe(false);
  });

  it("should clear password reset data after successful reset", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const resetCode = getPasswordResetCode();

    const resetRes = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        email: verifiedUserEmail,
        passwordResetCode: resetCode,
        newPassword: newPassword,
      });

    expect(resetRes.status).toBe(200);

    const user = await UserModel.findOne({ email: verifiedUserEmail }).lean();
    expect(user).toBeTruthy();
    expect(user?.passwordResetCode).toBeNull();
    expect(user?.passwordResetCodeExpiry).toBeNull();
  });

  it("should not allow reusing the same reset code", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const resetCode = getPasswordResetCode();

    const firstReset = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        email: verifiedUserEmail,
        passwordResetCode: resetCode,
        newPassword: newPassword,
      });

    expect(firstReset.status).toBe(200);

    const secondReset = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        email: verifiedUserEmail,
        passwordResetCode: resetCode,
        newPassword: newPassword,
      });

    expect(secondReset.status).toBe(400);
    expect(secondReset.body.success).toBe(false);
  });

  it("should allow login with new password after reset", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const resetCode = getPasswordResetCode();

    await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: resetCode,
      newPassword: newPassword,
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: newPassword,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it("should not allow login with old password after reset", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const resetCode = getPasswordResetCode();

    await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: resetCode,
      newPassword: newPassword,
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUserEmail,
      password: testPassword,
    });

    expect(loginRes.status).toBe(400);
    expect(loginRes.body.success).toBe(false);
  });

  it("should work for unverified users", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: false,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const resetCode = getPasswordResetCode();

    const res = await request(app).post("/api/v1/auth/reset-password").send({
      email: verifiedUserEmail,
      passwordResetCode: resetCode,
      newPassword: newPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
