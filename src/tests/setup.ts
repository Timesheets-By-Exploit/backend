import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
}, 120000);

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
}, 120000);
