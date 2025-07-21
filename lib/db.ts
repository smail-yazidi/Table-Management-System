// lib/db.ts
import mongoose from "mongoose";
import { loadMongooseModels } from "./models"; // Import your new model loading utility

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Ensure models are loaded BEFORE attempting to connect or use cached connection.
  // This is critical for Next.js serverless functions.
  loadMongooseModels();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: "table-management-system",
      // useNewUrlParser: true, // Deprecated in recent Mongoose versions, can be removed
      // useUnifiedTopology: true, // Deprecated in recent Mongoose versions, can be removed
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
    // You can also call loadMongooseModels here, but calling it before `if (cached.conn)`
    // ensures models are available even if connection is cached.
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
