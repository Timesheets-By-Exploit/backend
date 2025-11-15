import mongoose from "mongoose";
import { MONGODB_URI } from "./env";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("🚨 MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
