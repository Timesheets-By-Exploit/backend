import UserModel from "@modules/user/user.model";
import OrganizationModel from "@modules/organization/organization.model";
import { UserFactory } from "@tests/factories/user.factory";
import { OrganizationFactory } from "@tests/factories/organization.factory";
import { IUser } from "@modules/user/user.types";
import { IOrganization } from "@modules/organization/organization.types";
import { retryOperation } from "@tests/utils";

export const seedOneUserWithOrg = async (
  userOverrides: Partial<IUser> | undefined = {},
  orgOverrides: Partial<IOrganization> | undefined = {},
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
    organization.owner = user._id;
    await organization.save();
    await user.save();
    return { user, organization };
  });
};

export const clearUsersAndOrgs = async () => {
  await retryOperation(() => UserModel.deleteMany({}));
  await retryOperation(() => OrganizationModel.deleteMany({}));
};
