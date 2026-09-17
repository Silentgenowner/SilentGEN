import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string | undefined;

function getMongoUri() {
  if (!MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI. Add it to your environment or .env.local. See .env.example for the expected format."
    );
  }
  return MONGODB_URI;
}

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalForMongoose = global as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const cached = (globalForMongoose.mongooseCache ??= {
  conn: null,
  promise: null,
});

export default async function connectDB() {
  const mongoUri = getMongoUri();
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, { dbName: "SilentGEN" });
  }

  // Concurrent requests share one attempt. An older failed attempt must not
  // clear a newer retry started by another request.
  const pending = cached.promise;
  try {
    const connection = await pending;
    if (cached.promise === pending) cached.conn = connection;
    return connection;
  } catch (error) {
    if (cached.promise === pending) {
      cached.promise = null;
      cached.conn = null;
    }
    throw error;
  }
}