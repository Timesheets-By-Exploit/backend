import { Router } from "express";
import authRouter from "@modules/auth/routes/auth.v1.routes";
import organizationRouter from "@modules/organization/routes/organization.v1.routes";
import membershipRouter from "@modules/membership/routes/membership.v1.routes";

const v1Router = Router();
v1Router.use("/auth", authRouter);
v1Router.use("/org", organizationRouter);
v1Router.use("/membership", membershipRouter);

export default v1Router;
