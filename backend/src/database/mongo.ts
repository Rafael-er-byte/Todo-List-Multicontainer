import mongoose from "mongoose";
import { logger } from "../logger";

function getMongoUri(): string {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  return mongoUri;
}

export async function connectMongo(): Promise<void> {
  await mongoose.connect(getMongoUri());
  logger.info("MongoDB connected");
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
