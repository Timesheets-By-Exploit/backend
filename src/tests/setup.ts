
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  const collections = await mongoose.connection.db?.collections();
  for (let collection of collections || []) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});
