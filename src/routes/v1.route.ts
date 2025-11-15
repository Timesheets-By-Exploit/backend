import { Router } from "express";
import authRouter from "@modules/auth/routes/auth.v1.routes";

const v1Router = Router();
v1Router.use("/auth", authRouter);

export default v1Router;
