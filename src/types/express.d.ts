import { IUser } from "@modules/user/user.types";
import { IOrganization } from "@modules/organization/organization.types";
import { MembershipRole } from "@modules/membership/membership.types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userOrg?: IOrganization;
      userRole?: MembershipRole;
    }
  }
}
