const dns = require('dns');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Set public DNS fallback for Windows SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI is not defined in environment or .env file.');
}

const client = new MongoClient(uri || '', {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db = null;

async function connectDB() {
  if (!uri) return null;
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
