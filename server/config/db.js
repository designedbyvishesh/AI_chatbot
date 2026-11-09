const dns = require('dns');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Set public DNS fallback for Windows SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn('MONGODB_URI is not set. Running without a database: the app falls back to browser localStorage.');
}

// Only create the client when a connection string exists. Creating it with an
// empty string throws at startup and takes the whole server down.
const client = uri
  ? new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    })
  : null;

let db = null;

async function connectDB() {
  if (!client) return null;
  try {
    await client.connect();
    db = client.db("design_system_ai");
    console.log("✅ Successfully connected to MongoDB Atlas (Cluster0: design_system_ai)");
    return db;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    return null;
  }
}

function getDB() {
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('MongoDB connection cleanly terminated.');
  }
}

module.exports = { connectDB, getDB, closeDB };
