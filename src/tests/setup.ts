import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  await mongoose.connection.db?.command({ ping: 1 }).catch(() => {});
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});
