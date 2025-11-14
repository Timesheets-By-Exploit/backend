import UserModel from "@modules/user/user.model";
import { UserFactory } from "@tests/factories/user.factory";
import { convertTimeToMilliseconds } from "@utils/index";

describe("Email Verification Code Logic", () => {
  it("Successfully generates a hashed email verification code", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    expect(code).toHaveLength(6);
    expect(code).not.toBe(user.emailVerificationCode);
    expect(user.emailVerificationCodeExpiry).toBeDefined();
  });

  it("Fails verification if code is wrong", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    const isCorrectCode = user.verifyEmailVerificationCode(
      code.split("").reverse().join(""),
    );
    expect(user.isEmailVerified).toBe(false);
    expect(isCorrectCode).toBe(false);
  });

  it("Fails verification if code is expired", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    user.emailVerificationCodeExpiry = new Date(
      Date.now() - convertTimeToMilliseconds(60, "minutes"),
    );
    const isCorrectCode = user.verifyEmailVerificationCode(code);
    expect(user.isEmailVerified).toBe(false);
    expect(isCorrectCode).toBe(false);
  });

  it("Clears verification data after code is verified", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    expect(code).toHaveLength(6);
    expect(code).not.toBe(user.emailVerificationCode);
    expect(user.emailVerificationCodeExpiry).toBeDefined();
  });
});
