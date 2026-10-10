import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<boolean> {
  if (!env.MONGODB_URI) return false;
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  return true;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
