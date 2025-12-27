import { IUser } from "./user.types";

export function serializeUser(user: IUser) {
  if (!user) return null;

  const obj =
    typeof user.toObject === "function" ? user.toObject() : { ...user };

  const safe = {
    id: obj._id?.toString(),
    email: obj.email,
    name: obj.name,
    role: obj.role,
    isEmailVerified: obj.isEmailVerified,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };

  return safe;
}
