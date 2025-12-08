import mongoose from "mongoose";

export const clearDB = async () => {
  const collections = await mongoose.connection.db?.collections();
  for (const collection of collections || []) {
    await collection.deleteMany({});
  }
};
