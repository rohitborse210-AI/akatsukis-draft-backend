import mongoose from 'mongoose';
import { config } from './env.js';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(config.mongodbUri, opts).then((mongooseInstance) => {
      console.log(`[Database] MongoDB connected successfully to host: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch((err) => {
      console.error('[Database] MongoDB connection failed:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
};
