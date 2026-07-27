import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please add MONGODB_URI in .env.local"
  );
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

  if (cached!.conn) {
    return cached!.conn;
  }


  if (!cached!.promise) {

    cached!.promise = mongoose.connect(
      MONGODB_URI,
      {
        dbName: "SilentGEN",
      }
    );

  }


  cached!.conn = await cached!.promise;


  return cached!.conn;

}
