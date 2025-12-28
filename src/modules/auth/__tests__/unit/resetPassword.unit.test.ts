import UserModel from "@modules/user/user.model";
import { UserFactory } from "@tests/factories/user.factory";
import { convertTimeToMilliseconds } from "@utils/index";

describe("Password Reset Code Logic", () => {
  it("successfully generates a hashed password reset code", async () => {
    const user = new UserModel({
      ...UserFactory.generate(),
      role: "owner",
    });
    const code = user.generatePasswordResetCode();
    await user.save();
    expect(code).toHaveLength(6);
    expect(code).not.toBe(user.passwordResetCode);
    expect(user.passwordResetCodeExpiry).toBeDefined();
  });

  it("fails verification if code is wrong", async () => {
    const user = new UserModel({
      ...UserFactory.generate(),
      role: "owner",
    });
    const code = user.generatePasswordResetCode();
    await user.save();
    const isCorrectCode = user.verifyPasswordResetCode(
      code.split("").reverse().join(""),
    );
    expect(isCorrectCode).toBe(false);
  });

  it("fails verification if code is expired", async () => {
    const user = new UserModel({
      ...UserFactory.generate(),
      role: "owner",
    });
    const code = user.generatePasswordResetCode();
    await user.save();
    user.passwordResetCodeExpiry = new Date(
      Date.now() - convertTimeToMilliseconds(60, "minutes"),
    );
    await user.save();
    const isCorrectCode = user.verifyPasswordResetCode(code);
    expect(isCorrectCode).toBe(false);
  });

  it("successfully verifies code with correct code", async () => {
    const user = new UserModel({
      ...UserFactory.generate(),
      role: "owner",
    });
    const code = user.generatePasswordResetCode();
    await user.save();
    const isCorrectCode = user.verifyPasswordResetCode(code);
    expect(isCorrectCode).toBe(true);
  });

  it("clears password reset data after clearing", async () => {
    const user = new UserModel({
      ...UserFactory.generate(),
      role: "owner",
    });
    user.generatePasswordResetCode();
    await user.save();
    expect(user.passwordResetCode).toBeTruthy();
    expect(user.passwordResetCodeExpiry).toBeTruthy();

    await user.clearPasswordResetData();

    expect(user.passwordResetCode).toBeNull();
    expect(user.passwordResetCodeExpiry).toBeNull();
  });
});
