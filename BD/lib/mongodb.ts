import { MongoClient, type Db, ServerApiVersion } from "mongodb"

// Use MongoDB URI from environment variable
const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error('❌ Invalid/Missing environment variable: "MONGODB_URI"')
}

// Base MongoDB options
const baseOptions = {
  tls: true,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

// Allow invalid TLS certs only in development
const options =
  process.env.NODE_ENV === "development"
    ? { ...baseOptions, tlsAllowInvalidCertificates: true }
    : baseOptions

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().then((c) => {
      return c
    }).catch((err) => {
      throw err
    })
  }

  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect().then((c) => {
    return c
  }).catch((err) => {
    throw err
  })
}

export default clientPromise

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db("venu_portfolio")
  } catch (error) {
    throw error
  }
}
