import mongoose from "mongoose";
import { env, getMissingMongoEnv } from "./env.js";

let connectionPromise;

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const missing = getMissingMongoEnv();

  if (missing.length > 0) {
    throw new Error(`MongoDB configuration is incomplete: ${missing.join(", ")}`);
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    await connectionPromise;
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (mongoose.connection.readyState === 0) {
    connectionPromise = undefined;
    return;
  }

  await mongoose.disconnect();
  connectionPromise = undefined;
}

export async function verifyDatabaseConnection() {
  const connection = await connectToDatabase();
  await connection.db.admin().ping();
  return {
    name: connection.name,
    readyState: connection.readyState,
  };
}
