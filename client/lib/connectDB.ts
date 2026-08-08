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


let cached = globalForMongoose.mongooseCache;


if (!cached) {
  cached = {
    conn: null,
    promise: null,
  };

  globalForMongoose.mongooseCache = cached;
}


export default async function connectDB() {
  const mongoUri = getMongoUri();

  if (cached!.conn) {
    return cached!.conn;
  }


  if (!cached!.promise) {

    cached!.promise = mongoose.connect(
      mongoUri,
      {
        dbName: "SilentGEN",
      }
    );

  }


  cached!.conn = await cached!.promise;


  return cached!.conn;

}
