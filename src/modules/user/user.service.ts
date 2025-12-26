import UserModel from "@modules/user/user.model";
import { IUser } from "@modules/user/user.types";

const UserService = {
  getUserByEmail: async (email: string): Promise<IUser | null> => {
    return await UserModel.findOne({ email });
  },

  getUserById: async (id: string): Promise<IUser | null> => {
    return await UserModel.findById(id);
  },
};

export default UserService;
