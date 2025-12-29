import { z } from "zod";

export const createMembershipSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
  status: z.enum(["ACTIVE", "DISABLED", "PENDING"]).optional(),
});
