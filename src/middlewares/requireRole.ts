import { Request, Response, NextFunction } from "express";
import AppError from "@utils/AppError";
import { IUser } from "@modules/user/user.types";
import OrganizationService from "@modules/organization/organization.service";
import { MembershipRole } from "@modules/membership/membership.types";
import { ISuccessPayload } from "src/types";
import { IOrganization } from "@modules/organization/organization.types";

const requireRole = (allowedRoles: MembershipRole[]) => {
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

    const userRole = (
      orgResult as ISuccessPayload<{
        organization: IOrganization;
        role: MembershipRole;
      }>
    ).data.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        AppError.forbidden(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        ),
      );
    }

    next();
  };
};

export default requireRole;
