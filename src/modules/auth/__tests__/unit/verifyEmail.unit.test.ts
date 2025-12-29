import UserService from "@modules/user/user.service";
import { UserFactory } from "@tests/factories/user.factory";
import { convertTimeToMilliseconds } from "@utils/index";

describe("Email Verification Code Logic", () => {
  it("successfully generates a hashed email verification code", async () => {
    const user = await UserService.createUser(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    expect(code).toHaveLength(6);
    expect(code).not.toBe(user.emailVerificationCode);
    expect(user.emailVerificationCodeExpiry).toBeDefined();
  });

  it("fails verification if code is wrong", async () => {
    const user = await UserService.createUser(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    const isCorrectCode = user.verifyEmailVerificationCode(
      code.split("").reverse().join(""),
    );
    expect(user.isEmailVerified).toBe(false);
    expect(isCorrectCode).toBe(false);
  });

  it("fails verification if code is expired", async () => {
    const user = await UserService.createUser(UserFactory.generate());
    const code = user.generateEmailVerificationCode();
    user.emailVerificationCodeExpiry = new Date(
      Date.now() - convertTimeToMilliseconds(60, "minutes"),
    );
    const isCorrectCode = user.verifyEmailVerificationCode(code);
    expect(user.isEmailVerified).toBe(false);
    expect(isCorrectCode).toBe(false);
  });

  it("successfully verifies code with correct code", async () => {
    const user = await UserService.createUser({
      ...UserFactory.generate(),
    });
    const code = user.generateEmailVerificationCode();
    await user.save(); // Save to trigger pre-save hook that sets expiry
    const isCorrectCode = user.verifyEmailVerificationCode(code);
    expect(isCorrectCode).toBe(true);
    expect(user.isEmailVerified).toBe(true);
  });

  it("clears verification data after clearing", async () => {
    const user = await UserService.createUser({
      ...UserFactory.generate(),
    });
    user.generateEmailVerificationCode();
    await user.save(); // Save to trigger pre-save hook that sets expiry
    expect(user.emailVerificationCode).toBeTruthy();
    expect(user.emailVerificationCodeExpiry).toBeTruthy();

    await user.clearEmailVerificationData();

    expect(user.emailVerificationCode).toBeNull();
    expect(user.emailVerificationCodeExpiry).toBeNull();
  });
});
