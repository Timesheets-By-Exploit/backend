import UserModel from "@modules/user/user.model";
import OrganizationModel from "@modules/organization/organization.model";
import MembershipModel from "@modules/membership/membership.model";
import { UserFactory } from "@tests/factories/user.factory";
import { OrganizationFactory } from "@tests/factories/organization.factory";
import { IUser } from "@modules/user/user.types";
import { IOrganization } from "@modules/organization/organization.types";
import { retryOperation } from "@tests/utils";
import { UserRole } from "@constants";

export const seedUserInOrg = async (
  orgId: string,
  userOverrides: Partial<IUser> | undefined = {},
  role: UserRole = "MEMBER",
) => {
  return retryOperation(async () => {
    const userData = {
      ...UserFactory.generate(),
      organization: orgId,
      isEmailVerified: true,
      ...userOverrides,
    };

    const user = new UserModel(userData);
    const membership = new MembershipModel({
      orgId: orgId,
      userId: user._id,
      role: role,
      status: "ACTIVE",
      joinedAt: new Date(),
    });

    await user.save();
    await membership.save();

    return { user, membership };
  });
};

export const seedOneUserWithOrg = async (
  userOverrides: Partial<IUser> | undefined = {},
  orgOverrides: Partial<IOrganization> | undefined = {},
  role: UserRole = "OWNER",
) => {
  return retryOperation(async () => {
    const organization = new OrganizationModel({
      ...OrganizationFactory.generate(),
      ...orgOverrides,
    });

    const userData = {
      ...UserFactory.generate(),
      organization: organization._id,
      isEmailVerified: true,
      ...userOverrides,
    };

    const user = new UserModel(userData);
    organization.owner = orgOverrides.owner || user._id;

    const membership = new MembershipModel({
      orgId: organization._id,
      userId: user._id,
      role: role,
      status: "ACTIVE",
      joinedAt: new Date(),
    });

    await organization.save();
    await user.save();
    await membership.save();

    return { user, organization, membership };
  });
};

export const clearUsersAndOrgs = async () => {
  await retryOperation(() => UserModel.deleteMany({}));
  await retryOperation(() => OrganizationModel.deleteMany({}));
};
