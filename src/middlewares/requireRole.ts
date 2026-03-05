import { Request, Response, NextFunction } from "express";
import AppError from "@utils/AppError";
import { IUser } from "@modules/user/user.types";
import OrganizationService from "@modules/organization/organization.service";
import { UserRole } from "@constants";
import { ISuccessPayload } from "src/types";
import { IOrganization } from "@modules/organization/organization.types";

const requireRole = (allowedRoles: UserRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user as IUser;

    if (!user) {
      return next(AppError.unauthorized("User not found"));
    }

    const orgResult = await OrganizationService.getUserOrganization(
      user._id.toString(),
    );

    if (!orgResult.success) {
      return next(AppError.notFound("User does not have an organization"));
    }

    const successfulOrgResult = orgResult as ISuccessPayload<{
      organization: IOrganization;
      role: UserRole;
    }>;

    if (!allowedRoles.includes(successfulOrgResult.data.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        ),
      );
    }
    req.userOrg = successfulOrgResult.data.organization;
    req.userRole = successfulOrgResult.data.role;
    next();
  };
};

export default requireRole;
