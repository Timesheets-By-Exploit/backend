import { IUser } from "@modules/user/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
