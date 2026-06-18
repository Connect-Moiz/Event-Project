import 'server-only'
import mongoose, { type ConnectOptions, type Mongoose } from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI?.trim() ?? ''

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

type MongooseConnectionCache = {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseConnectionCache
}

// Reuse the same cache across hot reloads in development.
const cached = globalForMongoose.mongoose ?? { conn: null, promise: null }

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = cached
}

export async function connectToDatabase(): Promise<Mongoose> {
  // Return the existing connection immediately when available.
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const options: ConnectOptions = {
      // Disable Mongoose command buffering to fail fast if not connected.
      bufferCommands: false,
      // Make connection failures surface quickly during local development.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    }

    // Store the in-flight promise so concurrent calls share one connection attempt.
    cached.promise = mongoose.connect(MONGODB_URI, options)
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    // Reset the promise so future calls can retry after a failed attempt.
    cached.promise = null
    if (error instanceof Error && MONGODB_URI.startsWith('mongodb+srv://')) {
      error.message =
        `${error.message} ` +
        'If this is an Atlas SRV URI, verify that your IP is allowed in Atlas Network Access ' +
        'or switch to Atlas\'s standard mongodb:// connection string.'
    }
    throw error
  }

  return cached.conn
}

export default connectToDatabase
