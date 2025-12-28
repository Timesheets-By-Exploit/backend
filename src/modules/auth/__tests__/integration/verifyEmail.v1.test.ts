import request from "supertest";
import app from "@app";
import { UserFactory } from "@tests/factories/user.factory";
import { sendEmailWithTemplate } from "@services/email.service";
import UserModel from "@modules/user/user.model";
import { convertTimeToMilliseconds } from "@utils/index";
import { clearDB } from "@tests/utils";

jest.mock("@services/email.service");

beforeEach(async () => {
  await clearDB();
});

beforeEach(() => {
  (sendEmailWithTemplate as jest.Mock).mockResolvedValue({
    success: true,
    emailSent: true,
  });
});

function getVerificationCode(index = 0) {
  const call = (sendEmailWithTemplate as jest.Mock).mock.calls[index][0];
  return call.merge_info.emailVerificationCode;
}

describe("Email Verification", () => {
  it("should not verify user's email with invalid code", async () => {
    const user = UserFactory.generate();

    const signupResponse = await request(app)
      .post("/api/v1/auth/signup")
      .send(user);
    const verifyEmailRes = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: user.email, emailVerificationCode: "RANDOM" });
    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body.success).toBe(true);
    expect(verifyEmailRes.status).toBe(400);
    expect(verifyEmailRes.body.success).toBe(false);
  });

  it("should not verify user's email with expired code", async () => {
    const user = UserFactory.generate();

    await request(app).post("/api/v1/auth/signup").send(user);

    const userInDb = await UserModel.findOne({ email: user.email });
    if (userInDb) {
      userInDb.emailVerificationCodeExpiry = new Date(
        Date.now() - convertTimeToMilliseconds(1, "min"),
      );
      await userInDb.save();
    }

    const verifyEmailRes = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({
        email: user.email,
        emailVerificationCode: getVerificationCode(),
      });

    expect(verifyEmailRes.status).toBe(400);
    expect(verifyEmailRes.body.success).toBe(false);
  });

  it("should verify user's email after signup", async () => {
    const user = UserFactory.generate();

    await request(app).post("/api/v1/auth/signup").send(user);

    const verifyEmailRes = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({
        email: user.email,
        emailVerificationCode: getVerificationCode(),
      });

    expect(verifyEmailRes.status).toBe(200);
    expect(verifyEmailRes.body.success).toBe(true);
  });

  it("should fail if user retries with the same code after being verified", async () => {
    const user = UserFactory.generate();

    await request(app).post("/api/v1/auth/signup").send(user);

    const firstVerificationResponse = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({
        email: user.email,
        emailVerificationCode: getVerificationCode(),
      });

    expect(firstVerificationResponse.status).toBe(200);
    expect(firstVerificationResponse.body.success).toBe(true);

    const secondVerificationResponse = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({
        email: user.email,
        emailVerificationCode: getVerificationCode(),
      });

    expect(secondVerificationResponse.status).toBe(400);
    expect(secondVerificationResponse.body.success).toBe(false);
  });
  it("resends verification code and previous code is different from new code", async () => {
    const user = UserFactory.generate();

    await request(app).post("/api/v1/auth/signup").send(user);

    const resendVerificationCodeResponse = await request(app)
      .post("/api/v1/auth/resend-verification-email")
      .send({
        email: user.email,
      });

    expect(resendVerificationCodeResponse.status).toBe(200);
    expect(getVerificationCode() === getVerificationCode(1)).toBeFalsy();
  });
  it("cannot resend verification email to non existent user", async () => {
    const user = UserFactory.generate();

    const resendVerificationCodeResponse = await request(app)
      .post("/api/v1/auth/resend-verification-email")
      .send({
        email: user.email,
      });

    expect(resendVerificationCodeResponse.status).toBe(400);
  });
});
