import { z } from "zod";

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isOnboarded: z.boolean().optional(),
  onboardingStep: z.number().min(0).max(4).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
