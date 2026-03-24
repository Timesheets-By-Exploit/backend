import request from "supertest";
import app from "@app";
import { UserFactory } from "@tests/factories/user.factory";
import { sendEmailWithTemplate } from "@services/email.service";
import UserService from "@modules/user/user.service";
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

    const userInDb = await UserService.getUserByEmail(user.email);
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

  it("should verify user's email after signup and sign them in", async () => {
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

    // Should return user data
    expect(verifyEmailRes.body.data.user).toBeDefined();
    expect(verifyEmailRes.body.data.user.email).toBe(user.email.toLowerCase());
    expect(verifyEmailRes.body.data.user.isEmailVerified).toBe(true);

    // Should set auth cookies
    const cookies = verifyEmailRes.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const access = cookieArray.find((c: string) =>
      c.startsWith("access_token="),
    );
    const refresh = cookieArray.find((c: string) =>
      c.startsWith("refresh_token="),
    );

    expect(access).toContain("HttpOnly");
    expect(access).toContain("SameSite=Lax");
    expect(access).toContain("Path=/");

    expect(refresh).toContain("HttpOnly");
    expect(refresh).toContain("SameSite=Lax");
    expect(refresh).toContain("Path=/auth/refresh");
  });

  it("should allow access to protected routes after email verification without separate login", async () => {
    const user = UserFactory.generate();

    await request(app).post("/api/v1/auth/signup").send(user);

    const verifyEmailRes = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({
        email: user.email,
        emailVerificationCode: getVerificationCode(),
      });

    expect(verifyEmailRes.status).toBe(200);

    // Extract the access_token cookie from the verify response
    const cookies = verifyEmailRes.headers["set-cookie"];
    const cookieArray = (Array.isArray(cookies) ? cookies : [cookies]).filter(
      (c): c is string => typeof c === "string",
    );
    const accessCookie = cookieArray.find((c: string) =>
      c.startsWith("access_token="),
    );

    // Use the cookie to access a protected route
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookieArray);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe(user.email.toLowerCase());
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
    expect(firstVerificationResponse.body.data.user).toBeDefined();

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

    expect(resendVerificationCodeResponse.status).toBe(200);
  });
});
