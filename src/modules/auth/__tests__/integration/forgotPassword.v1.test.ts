import request from "supertest";
import app from "@app";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import { clearDB } from "@tests/utils";
import { sendEmailWithTemplate } from "@services/email.service";
import UserModel from "@modules/user/user.model";
import { TEST_CONSTANTS } from "../helpers/testHelpers";

jest.mock("@services/email.service");

const { verifiedUserEmail, testPassword } = TEST_CONSTANTS;

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

describe("POST /api/v1/auth/forgot-password", () => {
  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if email is invalid format", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "invalid-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 200 even if user does not exist (security)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nonexistent@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.emailSent).toBe(true);
    expect(res.body.data.message).toBe(
      "Password reset email sent successfully",
    );
  });

  it("should return 200 and send password reset email for existing user", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.emailSent).toBe(true);
    expect(res.body.data.message).toBe(
      "Password reset email sent successfully",
    );
  });

  it("should generate and store password reset code in database", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const user = await UserModel.findOne({ email: verifiedUserEmail });
    expect(user).toBeTruthy();
    expect(user?.passwordResetCode).toBeTruthy();
    expect(user?.passwordResetCodeExpiry).toBeTruthy();
  });

  it("should send email with correct template data", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    expect(sendEmailWithTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [
          {
            email_address: {
              address: verifiedUserEmail,
              name: expect.any(String),
            },
          },
        ],
        merge_info: {
          passwordResetCode: expect.any(String),
          passwordResetExpiry: "30 minutes",
          name: expect.any(String),
        },
        subject: "Reset your password",
      }),
    );
  });

  it("should generate different codes on multiple requests", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const firstCode = getPasswordResetCode();

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const secondCode = getPasswordResetCode(1);

    expect(firstCode).not.toBe(secondCode);
  });

  it("should update password reset code expiry on new request", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const firstRequest = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    expect(firstRequest.status).toBe(200);

    const userAfterFirst = await UserModel.findOne({
      email: verifiedUserEmail,
    });
    const firstExpiry = userAfterFirst?.passwordResetCodeExpiry;

    await new Promise((resolve) => setTimeout(resolve, 100));

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    const userAfterSecond = await UserModel.findOne({
      email: verifiedUserEmail,
    });
    const secondExpiry = userAfterSecond?.passwordResetCodeExpiry;

    expect(secondExpiry?.getTime()).toBeGreaterThan(
      firstExpiry?.getTime() || 0,
    );
  });

  it("should work for unverified users", async () => {
    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: false,
    });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.emailSent).toBe(true);
  });

  it("should handle email service failure gracefully", async () => {
    (sendEmailWithTemplate as jest.Mock).mockResolvedValueOnce({
      success: false,
      emailSent: false,
      error: "Email service unavailable",
    });

    await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: verifiedUserEmail });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
