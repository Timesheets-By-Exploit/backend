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

  it("successfully verifies code with correct code", async () => {
    const user = new UserModel({
      ...UserFactory.generate(),
      role: "owner",
    });
    const code = user.generateEmailVerificationCode();
    await user.save();
    const isCorrectCode = user.verifyEmailVerificationCode(code);
    expect(isCorrectCode).toBe(true);
    expect(user.isEmailVerified).toBe(true);
  });

  it("clears verification data after clearing", async () => {
    const user = new UserModel({
      ...UserFactory.generate(),
      role: "owner",
    });
    user.generateEmailVerificationCode();
    await user.save();
    expect(user.emailVerificationCode).toBeTruthy();
    expect(user.emailVerificationCodeExpiry).toBeTruthy();

    await user.clearEmailVerificationData();

    expect(user.emailVerificationCode).toBeNull();
    expect(user.emailVerificationCodeExpiry).toBeNull();
  });
});
