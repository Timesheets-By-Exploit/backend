import mongoose from "mongoose";

export const clearDB = async () => {
  const models = mongoose.modelNames();
  for (const name of models) {
    await mongoose.model(name).deleteMany({});
  }
};
