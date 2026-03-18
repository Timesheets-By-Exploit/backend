import { Router } from "express";
import authenticate from "@middlewares/authenticate";
import validateResource from "@middlewares/validators";
import { updateUserSchema } from "../user.validators";
import { updateMe } from "../user.controller";

const userRouter = Router();

userRouter.put(
  "/me",
  authenticate,
  validateResource(updateUserSchema),
  updateMe,
);

export default userRouter;
