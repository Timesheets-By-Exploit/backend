import mongoose from "mongoose";
import { MONGODB_URI } from "./env";
import { logger } from "./logger";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI as string);
    logger.info({ host: conn.connection.host }, "MongoDB connected");

    mongoose.connection.on("error", (err) => {
      logger.error({ err }, "MongoDB connection error");
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
  } catch (error) {
    logger.fatal({ err: error }, "MongoDB connection failed");
    process.exit(1);
  }
};

export default connectDB;
