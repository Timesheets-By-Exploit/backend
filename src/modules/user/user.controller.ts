import { Request, Response } from "express";
import { routeTryCatcher } from "@utils/routeTryCatcher";
import UserService from "./user.service";
import { serializeUser } from "./user.utils";
import { UpdateUserInput } from "./user.validators";

export const updateMe = routeTryCatcher(async (req: Request, res: Response) => {
  const input: UpdateUserInput = req.body;
  const update = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as { firstName?: string; lastName?: string; isOnboarded?: boolean };
  const updated = await UserService.updateUser(
    req.user!._id.toString(),
    update,
  );
  return res.status(200).json({ success: true, data: serializeUser(updated!) });
});
