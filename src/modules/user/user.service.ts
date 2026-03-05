import UserModel from "@modules/user/user.model";
import { IUser } from "@modules/user/user.types";

const UserService = {
  getUserByEmail: async (email: string): Promise<IUser | null> => {
    return await UserModel.findOne({ email });
  },

  getUserById: async (id: string): Promise<IUser | null> => {
    return await UserModel.findById(id);
  },

  createUser: async (
    input: Pick<IUser, "firstName" | "lastName" | "email" | "password">,
  ): Promise<IUser> => {
    const { firstName, lastName, email, password } = input;
    const user = new UserModel({
      firstName,
      lastName,
      email,
      password,
      role: "owner",
    });
    await user.save();
    return user;
  },
};

export default UserService;
