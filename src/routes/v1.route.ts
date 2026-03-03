import { Router } from "express";
import authRouter from "@modules/auth/routes/auth.v1.routes";
import organizationRouter from "@modules/organization/routes/organization.v1.routes";
import membershipRouter from "@modules/membership/routes/membership.v1.routes";
import tagRouter from "@modules/tag/routes/tag.v1.routes";
import clientRouter from "@modules/client/routes/client.v1.routes";
import projectRouter from "@modules/project/routes/project.v1.routes";
import taskRouter from "@modules/task/routes/task.v1.routes";
import timeEntryRouter from "@modules/time-entry/routes/time-entry.v1.routes";

const v1Router = Router();
v1Router.use("/auth", authRouter);
v1Router.use("/org", organizationRouter);
v1Router.use("/membership", membershipRouter);
v1Router.use("/tags", tagRouter);
v1Router.use("/clients", clientRouter);
v1Router.use("/projects", projectRouter);
v1Router.use("/tasks", taskRouter);
v1Router.use("/time-entries", timeEntryRouter);

export default v1Router;
