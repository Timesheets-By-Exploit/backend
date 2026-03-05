import { z } from "zod";
import { USER_ROLES, MEMBERSHIP_STATUS } from "@constants";

export const createMembershipSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(Object.values(USER_ROLES) as [string, ...string[]], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
  status: z
    .enum(Object.values(MEMBERSHIP_STATUS) as [string, ...string[]])
    .optional(),
});
