import UserModel from "@modules/user/user.model";
import { UserFactory } from "@tests/factories/user.factory";
import { convertTimeToMilliseconds } from "@utils/index";

describe("Email Verification Code Logic", () => {
  it("successfully generates a hashed email verification code", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    expect(code).toHaveLength(6);
    expect(code).not.toBe(user.emailVerificationCode);
    expect(user.emailVerificationCodeExpiry).toBeDefined();
  });

  it("fails verification if code is wrong", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    const isCorrectCode = user.verifyEmailVerificationCode(
      code.split("").reverse().join(""),
    );
    expect(user.isEmailVerified).toBe(false);
    expect(isCorrectCode).toBe(false);
  });

  it("fails verification if code is expired", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    user.emailVerificationCodeExpiry = new Date(
      Date.now() - convertTimeToMilliseconds(60, "minutes"),
    );
    const isCorrectCode = user.verifyEmailVerificationCode(code);
    expect(user.isEmailVerified).toBe(false);
    expect(isCorrectCode).toBe(false);
  });

  it("clears verification data after code is verified", async () => {
    const user = new UserModel(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    expect(code).toHaveLength(6);
    expect(code).not.toBe(user.emailVerificationCode);
    expect(user.emailVerificationCodeExpiry).toBeDefined();
  });
});
